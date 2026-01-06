import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { googleFetch, validateUserId, getAccessToken } from "../_shared/google-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-id",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

// Call Gemini with retry logic for rate limits
async function callGeminiAI(prompt: string, model: string = "google/gemini-2.5-flash"): Promise<string> {
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "You are a document summarization assistant. Provide clear, structured summaries with key points. Be comprehensive but concise.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "Unable to generate summary.";
    }

    const errorText = await response.text();
    console.error(`AI error (attempt ${attempt}):`, response.status, errorText);

    if (response.status === 402) {
      throw new Error("AI credits exhausted. Please add more credits.");
    }

    if (response.status === 429) {
      if (attempt < maxAttempts) {
        const backoff = Math.min(1500 * Math.pow(2, attempt - 1), 10000);
        console.log(`Rate limited, waiting ${backoff}ms...`);
        await sleep(backoff);
        continue;
      }
      throw new Error("AI rate limited - please wait and try again");
    }

    throw new Error("AI service unavailable");
  }

  return "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const userId = req.headers.get("x-user-id");
  if (!userId || !validateUserId(userId)) {
    return new Response(JSON.stringify({ error: "Authentication required" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { documentId, documentName, documentType, fileData } = body;

    // Handle local PDF upload (base64 data)
    if (fileData && documentType === "pdf") {
      console.log(`Processing local PDF upload: ${documentName}`);
      
      if (!LOVABLE_API_KEY) {
        return new Response(JSON.stringify({ error: "AI service not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate base64 data size (rough estimate: base64 is ~1.33x original)
      const estimatedSize = (fileData.length * 3) / 4;
      if (estimatedSize > 20 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: "File is too large. Maximum size is 20MB." }), {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Sending ${documentName} to Gemini Vision for OCR analysis...`);

      // Send directly to Gemini Vision for OCR
      const visionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: "You are an expert document analysis assistant with OCR capabilities. Extract ALL text from the provided PDF document, including text in images, scanned pages, handwritten content, tables, and diagrams. Then create a comprehensive summary that includes: 1) Main topic/purpose, 2) Key points and findings, 3) Important details, 4) Any conclusions or recommendations. Be thorough and preserve important data.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Please perform OCR and analyze this PDF document titled "${documentName}". Extract all readable text including any scanned/image-based content, then provide a comprehensive summary with key points and important details.`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:application/pdf;base64,${fileData}`,
                  },
                },
              ],
            },
          ],
        }),
      });

      if (!visionResponse.ok) {
        const errText = await visionResponse.text();
        console.error("Gemini Vision OCR error:", visionResponse.status, errText);
        
        if (visionResponse.status === 429) {
          return new Response(JSON.stringify({ error: "AI rate limited. Please wait a moment and try again." }), {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (visionResponse.status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        return new Response(JSON.stringify({ 
          error: "Could not process this PDF. It may be password-protected, corrupted, or in an unsupported format."
        }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const visionData = await visionResponse.json();
      const summary = visionData.choices?.[0]?.message?.content || "";

      if (!summary || summary.length < 30) {
        return new Response(JSON.stringify({ 
          error: "Could not extract meaningful content from this PDF. It may be empty, scanned poorly, or password-protected."
        }), {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`OCR Summary generated for ${documentName} (${summary.length} chars)`);

      return new Response(JSON.stringify({ summary }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!documentId || !documentName) {
      return new Response(JSON.stringify({ error: "Document ID and name are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Summarizing document: ${documentName} (type: ${documentType}, id: ${documentId})`);

    let documentContent = "";
    let fetchMethod = "none";

    // ─────────────────────────────────────────────────────────────
    // Google Docs – use Docs API for structured text
    // ─────────────────────────────────────────────────────────────
    if (documentType === "document") {
      try {
        const response = await googleFetch(userId, `https://docs.googleapis.com/v1/documents/${documentId}`);
        if (response.ok) {
          const doc = await response.json();
          if (doc.body?.content) {
            for (const element of doc.body.content) {
              if (element.paragraph?.elements) {
                for (const textElement of element.paragraph.elements) {
                  if (textElement.textRun?.content) {
                    documentContent += textElement.textRun.content;
                  }
                }
              }
              if (element.table?.tableRows) {
                for (const row of element.table.tableRows) {
                  for (const cell of row.tableCells || []) {
                    for (const cellContent of cell.content || []) {
                      if (cellContent.paragraph?.elements) {
                        for (const textElement of cellContent.paragraph.elements) {
                          if (textElement.textRun?.content) {
                            documentContent += textElement.textRun.content;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
            fetchMethod = "docs-api";
          }
        }

        // Fallback: Drive export as plain text
        if (!documentContent.trim()) {
          const exportResp = await googleFetch(
            userId,
            `https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=text/plain&supportsAllDrives=true`
          );
          if (exportResp.ok) {
            documentContent = await exportResp.text();
            fetchMethod = "drive-export-text";
          }
        }
      } catch (e) {
        console.log("Could not fetch Google Doc content:", e);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Google Sheets – export as CSV
    // ─────────────────────────────────────────────────────────────
    if (documentType === "spreadsheet") {
      try {
        const exportResp = await googleFetch(
          userId,
          `https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=text/csv&supportsAllDrives=true`
        );
        if (exportResp.ok) {
          documentContent = await exportResp.text();
          fetchMethod = "drive-export-csv";
        }
      } catch (e) {
        console.log("Could not export spreadsheet:", e);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Google Slides – export as plain text
    // ─────────────────────────────────────────────────────────────
    if (documentType === "presentation") {
      try {
        const exportResp = await googleFetch(
          userId,
          `https://www.googleapis.com/drive/v3/files/${documentId}/export?mimeType=text/plain&supportsAllDrives=true`
        );
        if (exportResp.ok) {
          documentContent = await exportResp.text();
          fetchMethod = "drive-export-text";
        }
      } catch (e) {
        console.log("Could not export presentation:", e);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // PDF / Image – Download and send to Gemini Vision
    // NEW APPROACH: Use Gemini's vision capabilities directly
    // ─────────────────────────────────────────────────────────────
    if (documentType === "pdf" || documentType === "image") {
      console.log(`Processing ${documentType} with Gemini Vision...`);
      
      try {
        // Get file metadata first
        const metaResp = await googleFetch(
          userId,
          `https://www.googleapis.com/drive/v3/files/${documentId}?fields=mimeType,size&supportsAllDrives=true`
        );
        
        if (!metaResp.ok) {
          if (metaResp.status === 404) {
            return new Response(JSON.stringify({ error: "File not found. It may have been deleted or you don't have access." }), {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (metaResp.status === 403) {
            return new Response(JSON.stringify({ error: "Access denied. Please check file sharing settings or reconnect Google." }), {
              status: 403,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          throw new Error("Could not access file");
        }
        
        const meta = await metaResp.json();
        const mimeType = meta.mimeType;
        const fileSize = parseInt(meta.size || "0", 10);
        
        console.log(`File: ${mimeType}, size: ${fileSize}`);
        
        // Check size limit (20MB max for processing)
        if (fileSize > 20 * 1024 * 1024) {
          return new Response(JSON.stringify({ error: "File is too large. Maximum size is 20MB." }), {
            status: 422,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Download the file
        const downloadResp = await googleFetch(
          userId,
          `https://www.googleapis.com/drive/v3/files/${documentId}?alt=media&supportsAllDrives=true`
        );

        if (!downloadResp.ok) {
          console.error("Download failed:", downloadResp.status);
          return new Response(JSON.stringify({ error: "Could not download file. Check permissions." }), {
            status: 422,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const fileBytes = await downloadResp.arrayBuffer();
        const base64Content = base64Encode(fileBytes);

        console.log(`Downloaded ${fileBytes.byteLength} bytes, sending to Gemini Vision...`);

        // Send to Gemini with vision capabilities
        if (!LOVABLE_API_KEY) {
          throw new Error("LOVABLE_API_KEY is not configured");
        }

        const visionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: "You are a document analysis assistant. Extract all text content from the provided document and create a comprehensive summary. Include key points, main topics, and important details. If the document contains tables, lists, or structured data, preserve that structure in your summary.",
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Please analyze this ${documentType === "pdf" ? "PDF document" : "image"} titled "${documentName}" and provide a comprehensive summary. Extract all readable text and summarize the key content, main topics, and important details.`,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${mimeType};base64,${base64Content}`,
                    },
                  },
                ],
              },
            ],
          }),
        });

        if (!visionResponse.ok) {
          const errText = await visionResponse.text();
          console.error("Gemini Vision error:", visionResponse.status, errText);
          
          if (visionResponse.status === 429) {
            return new Response(JSON.stringify({ error: "AI rate limited. Please wait a moment and try again." }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (visionResponse.status === 402) {
            return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
              status: 402,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          
          // If vision fails, provide helpful error
          return new Response(JSON.stringify({ 
            error: documentType === "pdf" 
              ? "Could not process this PDF. It may be password-protected, corrupted, or in an unsupported format."
              : "Could not process this image. Try a different format (JPG, PNG) or higher quality image."
          }), {
            status: 422,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const visionData = await visionResponse.json();
        const summary = visionData.choices?.[0]?.message?.content || "";

        if (!summary || summary.length < 30) {
          return new Response(JSON.stringify({ 
            error: documentType === "pdf"
              ? "Could not extract meaningful content from this PDF. It may be scanned poorly, password-protected, or mostly images without text."
              : "Could not extract meaningful content from this image. Try a clearer image with visible text."
          }), {
            status: 422,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        console.log(`Summary generated for ${documentName} via Gemini Vision (${summary.length} chars)`);

        return new Response(JSON.stringify({ summary }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      } catch (e) {
        console.error("PDF/Image processing error:", e);
        return new Response(JSON.stringify({ 
          error: "Failed to process document. Please try again or use a different file."
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log(`Content fetch method: ${fetchMethod}, content length: ${documentContent.length}`);

    // ─────────────────────────────────────────────────────────────
    // Fail if we couldn't extract meaningful content
    // ─────────────────────────────────────────────────────────────
    if (!documentContent.trim() || documentContent.trim().length < 30) {
      return new Response(JSON.stringify({ error: "Couldn't extract readable text from this document." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // Generate summary with Gemini
    // ─────────────────────────────────────────────────────────────
    const prompt = `Please provide a comprehensive summary of the document titled "${documentName}".

Document content:
${documentContent.substring(0, 60000)}

Create a well-structured summary with:
1. Main topic/purpose
2. Key points and findings
3. Important details
4. Any conclusions or recommendations`;

    const summary = await callGeminiAI(prompt);

    console.log(`Summary generated for ${documentName} (${summary.length} chars)`);

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Summarize error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";

    if (msg.includes("Session expired") || msg.includes("reconnect")) {
      return new Response(JSON.stringify({ error: "Session expired. Please reconnect Google." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (msg.includes("rate limit")) {
      return new Response(JSON.stringify({ error: msg }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (msg.includes("credits")) {
      return new Response(JSON.stringify({ error: msg }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Failed to summarize document. Please try again." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

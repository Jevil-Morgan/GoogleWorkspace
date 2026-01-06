import React from "react";

interface EmailBodyRendererProps {
  subject: string;
  bodyText?: string;
  bodyHtml?: string | null;
}

export function EmailBodyRenderer({ subject, bodyText, bodyHtml }: EmailBodyRendererProps) {
  if (bodyHtml) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <iframe
            title={`Email: ${subject}`}
            className="w-full h-[60vh] bg-background"
            // Sandbox prevents scripts from running. We intentionally do NOT allow scripts.
            sandbox=""
            srcDoc={bodyHtml}
          />
        </div>

        {bodyText ? (
          <details className="rounded-xl border border-border bg-card">
            <summary className="cursor-pointer select-none px-4 py-3 text-sm text-muted-foreground">
              View plain text
            </summary>
            <div className="px-4 pb-4">
              <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                {bodyText}
              </pre>
            </div>
          </details>
        ) : null}
      </div>
    );
  }

  return (
    <pre className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
      {bodyText}
    </pre>
  );
}

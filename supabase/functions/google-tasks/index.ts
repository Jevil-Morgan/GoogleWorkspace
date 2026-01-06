import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { googleFetch, validateUserId } from "../_shared/google-client.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-id",
};

function isAuthError(status: number) {
  return status === 401 || status === 403;
}

async function parseError(resp: Response): Promise<{ message: string; details: any }> {
  const text = await resp.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  const message =
    (json?.error?.message) ||
    (typeof json?.error === "string" ? json.error : null) ||
    resp.statusText ||
    "Request failed";

  return { message: String(message), details: json ?? text };
}

async function getDefaultTaskListId(userId: string): Promise<{ listId: string } | { error: string; status: number }> {
  console.log("Fetching default task list for user:", userId);
  
  const listsResp = await googleFetch(userId, "https://tasks.googleapis.com/tasks/v1/users/@me/lists");

  if (!listsResp.ok) {
    const err = await parseError(listsResp);
    console.error("Google Tasks lists error:", listsResp.status, err.details);

    if (isAuthError(listsResp.status)) {
      return { error: "Session expired or missing permissions. Please reconnect Google.", status: 401 };
    }

    return { error: `Google Tasks error: ${err.message}`, status: 500 };
  }

  const data = await listsResp.json();
  const listId = data?.items?.[0]?.id as string | undefined;
  
  if (!listId) {
    console.log("No task lists found, creating default list...");
    // Create a default task list if none exists
    const createResp = await googleFetch(userId, "https://tasks.googleapis.com/tasks/v1/users/@me/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "My Tasks" }),
    });
    
    if (createResp.ok) {
      const newList = await createResp.json();
      return { listId: newList.id };
    }
    
    return { error: "No task lists available and couldn't create one", status: 400 };
  }

  console.log("Using task list:", listId);
  return { listId };
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
    // ─────────────────────────────────────────────────────────────
    // GET – list tasks
    // ─────────────────────────────────────────────────────────────
    if (req.method === "GET") {
      console.log("GET tasks for user:", userId);
      
      const listRes = await getDefaultTaskListId(userId);
      if ("error" in listRes) {
        return new Response(JSON.stringify({ error: listRes.error }), {
          status: listRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tasksResp = await googleFetch(
        userId,
        `https://tasks.googleapis.com/tasks/v1/lists/${listRes.listId}/tasks?showCompleted=true&showHidden=true&maxResults=100`
      );

      if (!tasksResp.ok) {
        const err = await parseError(tasksResp);
        console.error("Google Tasks list error:", tasksResp.status, err.details);

        if (isAuthError(tasksResp.status)) {
          return new Response(JSON.stringify({ error: "Session expired. Please reconnect Google." }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: `Google Tasks error: ${err.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tasksData = await tasksResp.json();
      const tasks = (tasksData.items || []).map((task: any) => ({
        id: task.id,
        title: task.title,
        notes: task.notes,
        due: task.due,
        completed: task.status === "completed",
      }));

      console.log(`Returning ${tasks.length} tasks`);

      return new Response(JSON.stringify({ tasks }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // POST – create task
    // ─────────────────────────────────────────────────────────────
    if (req.method === "POST") {
      const body = await req.json();
      const { title, notes, due } = body;
      
      console.log("POST create task:", { title, notes, due });

      if (!title || !String(title).trim()) {
        return new Response(JSON.stringify({ error: "Title is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const listRes = await getDefaultTaskListId(userId);
      if ("error" in listRes) {
        return new Response(JSON.stringify({ error: listRes.error }), {
          status: listRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const taskBody: any = { title: String(title).trim(), status: "needsAction" };
      if (notes) taskBody.notes = String(notes);
      if (due) taskBody.due = new Date(due).toISOString();

      const createResp = await googleFetch(userId, `https://tasks.googleapis.com/tasks/v1/lists/${listRes.listId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskBody),
      });

      if (!createResp.ok) {
        const err = await parseError(createResp);
        console.error("Google Tasks create error:", createResp.status, err.details);

        if (isAuthError(createResp.status)) {
          return new Response(JSON.stringify({ error: "Session expired. Please reconnect Google." }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: `Failed to create task: ${err.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const task = await createResp.json();
      console.log("Task created:", task.id);
      
      return new Response(JSON.stringify({ task }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─────────────────────────────────────────────────────────────
    // PATCH – update task (toggle completion)
    // ─────────────────────────────────────────────────────────────
    if (req.method === "PATCH") {
      const body = await req.json();
      const { taskId, completed } = body;
      
      console.log("PATCH update task:", { taskId, completed });

      if (!taskId) {
        return new Response(JSON.stringify({ error: "Task ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const listRes = await getDefaultTaskListId(userId);
      if ("error" in listRes) {
        return new Response(JSON.stringify({ error: listRes.error }), {
          status: listRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // First, get the current task to ensure we have the latest data
      const getResp = await googleFetch(
        userId,
        `https://tasks.googleapis.com/tasks/v1/lists/${listRes.listId}/tasks/${taskId}`
      );

      if (!getResp.ok) {
        const err = await parseError(getResp);
        console.error("Google Tasks get error:", getResp.status, err.details);

        if (isAuthError(getResp.status)) {
          return new Response(JSON.stringify({ error: "Session expired. Please reconnect Google." }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: `Task not found: ${err.message}` }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const currentTask = await getResp.json();
      
      // Build update payload - Google Tasks requires specific fields
      const updatePayload: any = {
        id: taskId,
        title: currentTask.title,
        status: completed ? "completed" : "needsAction",
      };

      // Only include completed timestamp when completing
      if (completed) {
        updatePayload.completed = new Date().toISOString();
      }
      // When uncompleting, explicitly remove completed field by not including it

      console.log("Updating task with payload:", updatePayload);

      const patchResp = await googleFetch(
        userId,
        `https://tasks.googleapis.com/tasks/v1/lists/${listRes.listId}/tasks/${taskId}`,
        {
          method: "PUT", // Use PUT for full update (more reliable than PATCH)
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!patchResp.ok) {
        const err = await parseError(patchResp);
        console.error("Google Tasks update error:", patchResp.status, err.details);

        if (isAuthError(patchResp.status)) {
          return new Response(JSON.stringify({ error: "Session expired. Please reconnect Google." }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: `Failed to update task: ${err.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updated = await patchResp.json();
      console.log("Task updated:", updated.id, "status:", updated.status);

      return new Response(
        JSON.stringify({
          task: {
            id: updated.id,
            title: updated.title,
            notes: updated.notes,
            due: updated.due,
            completed: updated.status === "completed",
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─────────────────────────────────────────────────────────────
    // DELETE – delete task
    // ─────────────────────────────────────────────────────────────
    if (req.method === "DELETE") {
      const url = new URL(req.url);
      let taskId = url.searchParams.get("taskId");

      // Fallback to body if not in query
      if (!taskId) {
        try {
          const body = await req.json();
          taskId = body?.taskId ?? null;
        } catch {
          taskId = null;
        }
      }

      console.log("DELETE task:", taskId);

      if (!taskId) {
        return new Response(JSON.stringify({ error: "Task ID is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const listRes = await getDefaultTaskListId(userId);
      if ("error" in listRes) {
        return new Response(JSON.stringify({ error: listRes.error }), {
          status: listRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const delResp = await googleFetch(
        userId,
        `https://tasks.googleapis.com/tasks/v1/lists/${listRes.listId}/tasks/${taskId}`,
        { method: "DELETE" }
      );

      // Google returns 204 No Content on success
      if (!delResp.ok && delResp.status !== 204) {
        const err = await parseError(delResp);
        console.error("Google Tasks delete error:", delResp.status, err.details);

        if (isAuthError(delResp.status)) {
          return new Response(JSON.stringify({ error: "Session expired. Please reconnect Google." }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (delResp.status === 404) {
          // Task already deleted, treat as success
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ error: `Failed to delete task: ${err.message}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Task deleted successfully:", taskId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Tasks error:", error);
    const msg = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({
        error: msg.includes("Session expired") || msg.includes("reconnect")
          ? "Session expired. Please reconnect Google."
          : `Task operation failed: ${msg}`,
      }),
      { 
        status: msg.includes("Session expired") ? 401 : 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

import { facebookGraphApiBaseUrl, facebookPageAccessToken, facebookPageId } from "./config.js";

export async function publishFacebookPagePost(post, integration) {
  const pageId = facebookPageId || integration?.pageId;
  const pageAccessToken = facebookPageAccessToken;

  if (!pageId || !pageAccessToken) {
    return {
      ok: false,
      message: "Facebook Page API is not configured. Set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN.",
      externalPostId: null,
    };
  }

  const message = buildFacebookMessage(post);
  if (!message) {
    return {
      ok: false,
      message: "Facebook post copy is empty. Add copy before publishing.",
      externalPostId: null,
    };
  }

  const endpoint = `${facebookGraphApiBaseUrl.replace(/\/$/, "")}/${encodeURIComponent(pageId)}/feed`;
  const body = new URLSearchParams({
    message,
    access_token: pageAccessToken,
  });

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const payload = await parseGraphResponse(response);
    if (!response.ok || !payload.id) {
      return {
        ok: false,
        message: formatGraphError(payload, response.status),
        externalPostId: null,
      };
    }

    return {
      ok: true,
      message: "Facebook Page post published through Graph API.",
      externalPostId: payload.id,
    };
  } catch (error) {
    return {
      ok: false,
      message: `Facebook Graph API request failed: ${error.message}`,
      externalPostId: null,
    };
  }
}

function buildFacebookMessage(post) {
  return String(post.copy || post.title || "").trim();
}

async function parseGraphResponse(response) {
  const text = await response.text();
  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text } };
  }
}

function formatGraphError(payload, status) {
  const graphError = payload?.error;
  if (graphError?.message) {
    const code = graphError.code ? ` code ${graphError.code}` : "";
    return `Facebook Graph API error${code}: ${graphError.message}`;
  }

  return `Facebook Graph API returned HTTP ${status}.`;
}

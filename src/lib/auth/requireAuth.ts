// 

// Show more
// 7:29 PM
// This is your authentication guard — a reusable function you put at the top of any protected API route to answer one question: 
// "Is this request coming from a logged-in user with a valid token?"


/*
how to use it 
export async function POST(req: NextRequest) {
  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;   // not logged in -> return the 401 immediately

  const userId = auth.payload.userId;
  const outletId = auth.payload.activeOutletId;

}
*/

import { NextRequest, NextResponse } from "next/server";
import { AccessTokenPayload, verifyAccessToken } from "./jwt";

type AuthResult =
  | { ok: true; payload: AccessTokenPayload }
  | { ok: false; response: NextResponse };

export const requiredToken = async (req: NextRequest): Promise<AuthResult> => {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Missing or invalid Authorization header" },
          { status: 401 },
        ),
      };
    }
    const token = authHeader.slice("Bearer ".length);
    const payload = verifyAccessToken(token);
    return { ok: true, payload };
    
  } catch (error) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 },
      ),
    };
  }
};

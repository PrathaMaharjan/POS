import {
  createRecipe,
  deleteRecipe,
  getRecipe,
  updateRecipe,
} from "@/controller/recipe/recipeController";
import { requiredToken } from "@/lib/auth/requireAuth";
import { resolveOutletId } from "@/lib/auth/resolveOutletId";
import { requiredPermission } from "@/lib/permissions/requirePermission";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const recipeSchema = z.object({
  variantId: z.string().uuid().optional(), // ← new
  items: z
    .array(
      z.object({
        stockItemId: z.string().uuid(),
        quantity: z.number().positive(),
      }),
    )
    .min(1, "Recipe must have at least one ingredient"),
  outletId: z.string().uuid().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "inventory.recipes.read");
  if (permError) return permError;

  const resolved = await resolveOutletId(
    auth.payload,
    req.nextUrl.searchParams.get("outletId"),
  );
  if ("error" in resolved) {
    return NextResponse.json(
      { error: resolved.error },
      { status: resolved.status },
    );
  }

  // ── new — variantId read from query string ──
  const variantId = req.nextUrl.searchParams.get("variantId") ?? undefined;

  const result = await getRecipe(resolved.outletId, productId, variantId);
  console.log(result);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ recipe: result.data });
}

// export async function POST(
//   req: NextRequest,
//   { params }: { params: Promise<{ productId: string }> },
// ) {
//   const { productId } = await params;

//   const auth = await requiredToken(req);
//   if (!auth.ok) return auth.response;
//   const permError = requiredPermission(auth.payload, "inventory.recipes.read");
//   if (permError) return permError;
//   const body = await req.json();
//   const parsed = recipeSchema.safeParse(body);
//   if (!parsed.success) {
//     return NextResponse.json(
//       { error: parsed.error.flatten() },
//       { status: 400 },
//     );
//   }

//   const { outletId: requestedOutletId, ...data } = parsed.data;
//   const resolved = await resolveOutletId(
//     auth.payload,
//     req.nextUrl.searchParams.get("outletId"),
//   );
//   if ("error" in resolved) {
//     return NextResponse.json(
//       { error: resolved.error },
//       { status: resolved.status },
//     );
//   }
//   const result = await createRecipe(resolved.outletId, productId, data);
//   if (!result.success) {
//     return NextResponse.json(
//       { error: result.error },
//       { status: result.status },
//     );
//   }

//   return NextResponse.json(result.data, { status: 201 });
// }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  // NOTE — this was "inventory.recipes.read" in your pasted code,
  // which looks like a copy-paste slip for a CREATE route.
  // Changed to .create to match what this endpoint actually does.
  const permError = requiredPermission(
    auth.payload,
    "inventory.recipes.create",
  );
  if (permError) return permError;

  const body = await req.json();
  const parsed = recipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { outletId: requestedOutletId, ...data } = parsed.data;
  const resolved = await resolveOutletId(
    auth.payload,
    req.nextUrl.searchParams.get("outletId"),
  );
  if ("error" in resolved) {
    return NextResponse.json(
      { error: resolved.error },
      { status: resolved.status },
    );
  }

  const result = await createRecipe(resolved.outletId, productId, data);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(
    auth.payload,
    "inventory.recipes.delete",
  );
  if (permError) return permError;

  const resolved = await resolveOutletId(
    auth.payload,
    req.nextUrl.searchParams.get("outletId"),
  );
  if ("error" in resolved) {
    return NextResponse.json(
      { error: resolved.error },
      { status: resolved.status },
    );
  }

  // ── new — read variantId from query string ──
  const variantId = req.nextUrl.searchParams.get("variantId") ?? undefined;

  const result = await deleteRecipe(resolved.outletId, productId, variantId);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;

  const auth = await requiredToken(req);
  if (!auth.ok) return auth.response;

  const permError = requiredPermission(auth.payload, "inventory.recipes.update");
  if (permError) return permError;

  const body   = await req.json();
  const parsed = recipeSchema.safeParse(body); // ← recipeSchema already has variantId added from before
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { outletId: requestedOutletId, ...data } = parsed.data;
  const resolved = await resolveOutletId(auth.payload, requestedOutletId);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const result = await updateRecipe(resolved.outletId, productId, data);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.data);
}

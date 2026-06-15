import { db } from "@/db";
import { emailVerificationTokens, organizations, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import {
  generateVerificationToken,
  getVerificationExpiryDate,
} from "@/lib/auth/verificationToken";
import { sendVerificationEmail } from "@/lib/email/sendVerificationEmail";
import { slugify } from "@/utils/slugify";
import { NextRequest, NextResponse } from "next/server";
import z, { success } from "zod";

const schema = z.object({
  organizationName: z.string().min(2),
  ownerName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

async function generateUniqueSlug(baseName: string): Promise<string> {
  const base = slugify(baseName) || "org";
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await db.query.organizations.findFirst({
      where: (o, { eq }) => eq(o.slug, slug),
    });

    if (!existing) return slug;

    counter += 1;
    slug = `${base}-${counter}`;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parsed = schema.safeParse(body);
    // console.log(parsed)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { email, organizationName, ownerName, password } = parsed.data;
    // const existingUser = await db.query.users.findFirst({
    //   where: (u, { eq }) => eq(u.email, email),
    // });
    const existingUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.email, email),
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 409 },
      );
    }
    const slug = await generateUniqueSlug(organizationName);
    const passwordHash = await hashPassword(password);

    const [org] = await db
      .insert(organizations)
      .values({ name: organizationName, slug })
      .returning();
    const [user] = await db
      .insert(users)
      .values({
        organizationId: org.id,
        name: ownerName,
        email,
        passwordHash,
        isOwner: true,
        emailVerified: true,
      })
      .returning();
    // Generate + store verification token
    const { rawToken, tokenHash } = generateVerificationToken();
     await db.insert(emailVerificationTokens).values({
      userid: user.id,
      tokenhash: tokenHash,
      expiresAt: getVerificationExpiryDate(),
    });

    // console.log("data : ",data)
    // email validation
    // try {
    //   await sendVerificationEmail(email, rawToken);
    // } catch (err) {
    //   console.error("Failed to send verification email:", err);
    // }
    return NextResponse.json({
      message: "Organization registered successfully",
      organization: { id: org.id, name: org.name, slug: org.slug },
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    return NextResponse.json({
      message: "Organization registered successfully",
      data: error,
      success: false,
    });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle/drizzle";
import { users } from "@/lib/drizzle/schema";
import {
  createToken,
  storeAuthCookie,
  AUTH_COOKIE_NAME,
} from "@/lib/auth/jose";
import { exchangeCodeForUser } from "@/lib/auth/sso";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const ssoError = searchParams.get("error");
  const redirectTarget = searchParams.get("redirect") || "/dashboard";

  // Prevent open redirect vulnerabilities
  const safeRedirect =
    redirectTarget.startsWith("/") && !redirectTarget.startsWith("//")
      ? redirectTarget
      : "/dashboard";

  if (ssoError) {
    console.error("SSO returned error:", ssoError);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(ssoError)}`, request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        "/login?error=" +
          encodeURIComponent("Missing authorization code from SSO"),
        request.url,
      ),
    );
  }

  try {
    // 8. Exchange the Code for the User Payload
    const ssoUser = await exchangeCodeForUser(code);

    console.log(ssoUser);

    const email = ssoUser.email?.trim().toLowerCase();
    if (!email) {
      throw new Error("SSO user payload did not contain a valid email address");
    }

    const username = ssoUser.username?.trim() || null;
    const name =
      ssoUser.fullName?.trim() ||
      ssoUser.name?.trim() ||
      username ||
      email.split("@")[0] ||
      "User";

    const fatherName = ssoUser.fatherName?.trim() || null;
    const degree = ssoUser.degree?.trim() || null;
    const specialization = ssoUser.specialization?.trim() || null;
    const mobile = ssoUser.mobile?.trim() || null;
    const role = (ssoUser.role?.trim() || "student").toLowerCase();
    const photo = ssoUser.photo || ssoUser.photoUrl || null;

    // Check if user already exists in local database
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let localUser = existingUsers[0];

    // Check if user is banned
    if (localUser?.isBanned) {
      console.warn(`Banned user attempted login: ${email}`);
      return NextResponse.redirect(
        new URL(
          "/login?error=" +
            encodeURIComponent(
              "Your account has been suspended or banned. Please contact an administrator.",
            ),
          request.url,
        ),
      );
    }

    if (!localUser) {
      // Create user if not existing
      const inserted = await db
        .insert(users)
        .values({
          username,
          name,
          email,
          fatherName,
          degree,
          specialization,
          mobile,
          role: role || "student",
          isBanned: false,
          photo,
        })
        .returning();

      localUser = inserted[0];
    } else {
      // Keep all SSO fields up-to-date
      const shouldUpdate =
        (username && localUser.username !== username) ||
        (name && localUser.name !== name) ||
        (fatherName && localUser.fatherName !== fatherName) ||
        (degree && localUser.degree !== degree) ||
        (specialization && localUser.specialization !== specialization) ||
        (mobile && localUser.mobile !== mobile) ||
        (role && localUser.role !== role) ||
        (photo && localUser.photo !== photo);

      if (shouldUpdate) {
        const updated = await db
          .update(users)
          .set({
            username: username || localUser.username,
            name: name || localUser.name,
            fatherName: fatherName || localUser.fatherName,
            degree: degree || localUser.degree,
            specialization: specialization || localUser.specialization,
            mobile: mobile || localUser.mobile,
            role: role || localUser.role,
            photo: photo || localUser.photo,
          })
          .where(eq(users.id, localUser.id))
          .returning();

        if (updated.length > 0) {
          localUser = updated[0];
        }
      }
    }

    if (!localUser?.id) {
      throw new Error("Unable to create or retrieve user profile");
    }

    // Generate JWT token for child application session
    const token = await createToken(localUser.id);

    // Prepare redirect response
    const redirectUrl = new URL(safeRedirect, request.url);
    const response = NextResponse.redirect(redirectUrl);

    // Set cookie on response
    response.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    // Also persist via cookieStore for consistency
    await storeAuthCookie(token);

    return response;
  } catch (error: any) {
    console.error("SSO callback processing error:", error);
    const message = error?.message || "Failed to authenticate with SSO";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}

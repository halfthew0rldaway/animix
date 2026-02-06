import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { prisma, useDatabase } from "../../libs/prisma";

export const runtime = "nodejs";

function dbDisabledResponse() {
  return Response.json(
    { error: "Database disabled" },
    { status: 503 }
  );
}

export async function POST(req: NextRequest) {
  if (!useDatabase || !prisma) {
    return dbDisabledResponse();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    animeId?: string;
    episodeId?: string;
    title?: string;
    image?: string;
  };

  if (!body.episodeId || !body.title) {
    return Response.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const history = await prisma.watchHistory.create({
    data: {
      userId: session.user.id,
      animeId: body.animeId ?? null,
      episodeId: body.episodeId,
      title: body.title,
      image: body.image ?? null,
    },
  });

  return Response.json({ ok: true, history });
}

export async function GET() {
  if (!useDatabase || !prisma) {
    return dbDisabledResponse();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const history = await prisma.watchHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return Response.json({ ok: true, history });
}

export async function DELETE(req: NextRequest) {
  if (!useDatabase || !prisma) {
    return dbDisabledResponse();
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const result = await prisma.watchHistory.deleteMany({
    where: { id, userId: session.user.id },
  });

  if (result.count === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ ok: true, deleted: result.count });
}

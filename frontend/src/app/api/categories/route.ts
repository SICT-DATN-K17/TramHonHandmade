import { db } from "../_lib/mockData";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    return NextResponse.json(db.categories, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
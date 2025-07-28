export async function GET() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/your-endpoint`,
      {
        headers: {
          "Content-Type": "application/json",
          // Add any authentication headers if needed
        },
      }
    );

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Error fetching from Azure backend:", error);
    return Response.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

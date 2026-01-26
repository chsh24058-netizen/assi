export default async (req) => {
  const API_KEY = process.env.OPENWEATHER_API_KEY;

  const url = `https://api.openweathermap.org/data/2.5/weather?q=Tokyo&appid=${API_KEY}&lang=ja&units=metric`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "weather fetch failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
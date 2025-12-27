	/**
	 * Welcome to Cloudflare Workers! This is your first worker.
	 *
	 * - Run `npm run dev` in your terminal to start a development server
	 * - Open a browser tab at http://localhost:8787/ to see your worker in action
	 * - Run `npm run deploy` to publish your worker
	 *
	 * Learn more at https://developers.cloudflare.com/workers/
	 */
	/*
	export default {
		async fetch(request, env, ctx) {
			return new Response('Hello World!');
		},
	};*/

	export default {
	async fetch(request, env) {
		// CORS preflight
		if (request.method === "OPTIONS") {
		return new Response(null, {
			headers: corsHeaders(request),
		});
		}

		const url = new URL(request.url);

		if (url.pathname !== "/subscribe") {
		return new Response("Not Found", {
			status: 404,
			headers: corsHeaders(request),
		});
		}

		if (request.method !== "POST") {
		return new Response("Method Not Allowed", {
			status: 405,
			headers: corsHeaders(request),
		});
		}

		let data;
		try {
		data = await request.json();
		} catch {
		return json(
			{ ok: false, message: "Invalid JSON body" },
			400,
			request
		);
		}

		const email = (data.email || "").trim().toLowerCase();

		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		return json(
			{ ok: false, message: "Please provide a valid email." },
			400,
			request
		);
		}

		const resendResponse = await fetch("https://api.resend.com/contacts",
			{
				method: "POST",
				headers: {
				Authorization: `Bearer ${env.RESEND_API_KEY}`,
				"Content-Type": "application/json",
				},
				body: JSON.stringify({
				email,
				// optional but VERY useful
				unsubscribed: false,
				metadata: {
					source: "jfet-website",
				},
				}),
			}
		);

		if (!resendResponse.ok) {
		const text = await resendResponse.text(); // includes useful error code/message
			return json(
				{
				ok: false,
				message: "Resend rejected the request",
				status: resendResponse.status,
				details: text,
				},
				500,
				request
			);
		}


		return json(
		{ ok: true, message: "Subscribed 🎉 Check your inbox soon." },
		200,
		request
		);
	},
	};

	function corsHeaders(request) {
	const origin = request.headers.get("Origin") || "*";
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods": "POST, OPTIONS",
		"Access-Control-Allow-Headers": "Content-Type",
		"Vary": "Origin",
	};
	}

	function json(body, status, request) {
	return new Response(JSON.stringify(body), {
		status,
		headers: {
		"Content-Type": "application/json",
		...corsHeaders(request),
		},
	});
	}


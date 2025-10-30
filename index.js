/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import OpenAI from "openai"

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export default {
	async fetch(request, env, ctx) {
		// Handle CORS preflight requests
		if(request.method === 'OPTIONS'){
			return new Response(null, {headers: corsHeaders})
		}

		if (request.method === 'GET') {
      return new Response('Worker is live. Use POST to access the AI endpoint.', { headers: corsHeaders });
    }

		 // Only process POST requests
    	if (request.method !== 'POST') {
      	return new Response(JSON.stringify({ error: `${request.method} method not allowed.`}), { status: 405, headers: corsHeaders })
   		}
		const openai = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
			baseURL: "https://gateway.ai.cloudflare.com/v1/a4e2ea92aa915ee237bd6a11e0f68f86/trad-app/openai"
		})
		try{
			const messages = await request.json()
			const answer = await openai.chat.completions.create({
				model: 'gpt-4o-mini',
				messages,
				temperature: 0.1
			})
			const response = answer.choices[0].message.content.trim()
			return new Response(JSON.stringify({response}),{headers: corsHeaders})
		}
		catch(err){
			return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders})
		}
	},
};

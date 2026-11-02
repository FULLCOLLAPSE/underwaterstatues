import { handleAuth } from './_oauth.js';
export const onRequestGet = ({ request, env }) => handleAuth(request, env);

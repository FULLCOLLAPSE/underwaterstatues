import { handleCallback } from './_oauth.js';
export const onRequestGet = ({ request, env }) => handleCallback(request, env);

/*
 * Compatibility worker for older registrations that still point at /public/sw.js.
 * The canonical worker now lives at /sw.js so it can control the full site scope.
 */

importScripts('/sw.js');

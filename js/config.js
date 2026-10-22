// Verbindung zum Online-Speicher (Supabase).
// Beide Werte sind dafür gemacht, öffentlich in einer Webseite zu stehen; geschützt wird über den Login
// und die Zugriffsregeln in der Datenbank (supabase/einrichtung.sql).
// Sind sie leer, speichert die App nur im Browser (praktisch zum lokalen Testen).

export const SUPABASE_URL = '';
export const SUPABASE_ANON_KEY = '';

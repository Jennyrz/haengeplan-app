// Verbindung zum Online-Speicher (Supabase).
// Beide Werte sind dafür gemacht, öffentlich in einer Webseite zu stehen; geschützt wird über den Login
// und die Zugriffsregeln in der Datenbank (supabase/einrichtung.sql).
// Sind sie leer, speichert die App nur im Browser (praktisch zum lokalen Testen).

export const SUPABASE_URL = 'https://doyyjbvpfosaniwbnoyg.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRveXlqYnZwZm9zYW5pd2Jub3lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NTA0MDMsImV4cCI6MjEwODIyNjQwM30.abQSiidnXl2agr9o-Y-8Ycl2Y4ajexLssROB_xw6Pms';

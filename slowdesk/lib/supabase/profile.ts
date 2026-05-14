import { createClient } from './client';

function getClient() { return createClient(); }

export async function getUserProfile(userId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    name: data.name,
    bio: data.bio,
    role: data.role,
    location: data.location,
    avatar: data.avatar,
    status: data.status,
  };
}

export interface NotificationPrefs {
  emailEnabled: boolean;
  whatsappEnabled: boolean;
  callEnabled: boolean;
  callEveningEnabled: boolean;
  phone: string | null;
  time: string;
  timezone: string;
}

export async function getNotificationPrefs(userId: string): Promise<NotificationPrefs | null> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('user_profiles')
    .select('notification_email_enabled, notification_whatsapp_enabled, notification_call_enabled, notification_call_evening_enabled, notification_phone, notification_time, notification_timezone')
    .eq('id', userId)
    .single();

  if (error || !data) return null;

  return {
    emailEnabled:       data.notification_email_enabled         ?? false,
    whatsappEnabled:    data.notification_whatsapp_enabled       ?? false,
    callEnabled:        data.notification_call_enabled           ?? false,
    callEveningEnabled: data.notification_call_evening_enabled   ?? false,
    phone:              data.notification_phone                  ?? null,
    time:               data.notification_time                   ?? '08:00',
    timezone:           data.notification_timezone               ?? 'UTC',
  };
}

export async function updateNotificationPrefs(userId: string, prefs: Partial<NotificationPrefs>) {
  const supabase = getClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (prefs.emailEnabled       !== undefined) updates.notification_email_enabled         = prefs.emailEnabled;
  if (prefs.whatsappEnabled    !== undefined) updates.notification_whatsapp_enabled      = prefs.whatsappEnabled;
  if (prefs.callEnabled        !== undefined) updates.notification_call_enabled          = prefs.callEnabled;
  if (prefs.callEveningEnabled !== undefined) updates.notification_call_evening_enabled  = prefs.callEveningEnabled;
  if (prefs.phone    !== undefined)           updates.notification_phone                 = prefs.phone;
  if (prefs.time     !== undefined)           updates.notification_time                  = prefs.time;
  if (prefs.timezone !== undefined)           updates.notification_timezone              = prefs.timezone;

  const { error } = await supabase.from('user_profiles').update(updates).eq('id', userId);
  if (error) throw error;
  return true;
}

export async function createUserProfile(userId: string, name: string, _email: string) {
  const supabase = getClient();
  const { error } = await supabase.from('user_profiles').insert({ id: userId, name });
  if (error) throw error;
  return true;
}

export async function updateUserProfile(userId: string, updates: any) {
  const supabase = getClient();
  const { error } = await supabase
    .from('user_profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
  return true;
}

export async function getUserPreferences(userId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function updateUserPreferences(userId: string, updates: any) {
  const supabase = getClient();
  const { error } = await supabase
    .from('user_preferences')
    .upsert({ user_id: userId, ...updates, updated_at: new Date().toISOString() });
  if (error) throw error;
  return true;
}

export async function getGoogleCalendarStatus(userId: string) {
  const supabase = getClient();
  const { data } = await supabase
    .from('user_profiles')
    .select('google_calendar_connected, google_calendar_access_token, google_calendar_refresh_token, google_calendar_token_expiry')
    .eq('id', userId)
    .single();
  return data ?? null;
}

export async function saveGoogleCalendarTokens(userId: string, tokens: {
  accessToken: string;
  refreshToken: string | null;
  expiryMs: number;
}) {
  const supabase = getClient();
  const { error } = await supabase
    .from('user_profiles')
    .update({
      google_calendar_connected: true,
      google_calendar_access_token: tokens.accessToken,
      google_calendar_refresh_token: tokens.refreshToken,
      google_calendar_token_expiry: new Date(tokens.expiryMs).toISOString(),
    })
    .eq('id', userId);
  if (error) throw error;
}

export async function clearGoogleCalendarTokens(userId: string) {
  const supabase = getClient();
  await supabase
    .from('user_profiles')
    .update({
      google_calendar_connected: false,
      google_calendar_access_token: null,
      google_calendar_refresh_token: null,
      google_calendar_token_expiry: null,
    })
    .eq('id', userId);
  await supabase
    .from('calendar_events')
    .delete()
    .eq('user_id', userId)
    .eq('source', 'google');
}

export async function getNotifications(userId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(40);

  if (error || !data) return [];

  return data.map((n: any) => ({
    id: n.id,
    icon: n.icon,
    text: n.text,
    color: n.color,
    createdAt: n.created_at,
    readAt: n.read_at,
  }));
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const supabase = getClient();
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId);
  if (error) throw error;
  return true;
}

export async function getDailyCompletions(userId: string) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('daily_completions')
    .select('date, count')
    .eq('user_id', userId);

  if (error || !data) return {};

  const result: Record<string, number> = {};
  data.forEach((d: any) => { result[d.date] = d.count; });
  return result;
}

export async function incrementDailyCompletion(userId: string, date: string) {
  const supabase = getClient();
  const { data: existing } = await supabase
    .from('daily_completions')
    .select('id, count')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('daily_completions')
      .update({ count: existing.count + 1, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase.from('daily_completions').insert({ user_id: userId, date, count: 1 });
  }
  return true;
}

export async function decrementDailyCompletion(userId: string, date: string) {
  const supabase = getClient();
  const { data: existing } = await supabase
    .from('daily_completions')
    .select('id, count')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  if (existing && existing.count > 0) {
    await supabase
      .from('daily_completions')
      .update({ count: existing.count - 1, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  }
  return true;
}

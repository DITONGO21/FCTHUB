import { supabase } from './supabase';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async register({ name, email, password, role, turmaId }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role, turma_id: turmaId || null } },
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// ── Profiles ──────────────────────────────────────────────────────────────────

export const profilesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, turmas(name)')
      .order('name');
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, turmas(name)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async toggleActive(id, active) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ active })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ── Turmas ────────────────────────────────────────────────────────────────────

export const turmasApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('turmas')
      .select('*, profiles!turmas_professor_id_fkey(name)')
      .order('name');
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('turmas')
      .select('*, profiles!turmas_professor_id_fkey(name)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(turma) {
    const { data, error } = await supabase
      .from('turmas')
      .insert(turma)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('turmas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('turmas').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── Projects ──────────────────────────────────────────────────────────────────

export const projectsApi = {
  async getAll(filters = {}) {
    let query = supabase
      .from('projects')
      .select('*, profiles!projects_author_id_fkey(name, avatar_initials), turmas(name)')
      .order('updated_at', { ascending: false });

    if (filters.turmaId) query = query.eq('turma_id', filters.turmaId);
    if (filters.authorId) query = query.eq('author_id', filters.authorId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.search) query = query.ilike('title', `%${filters.search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('projects')
      .select('*, profiles!projects_author_id_fkey(name, avatar_initials, email), turmas(name)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(project) {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── Versions ──────────────────────────────────────────────────────────────────

export const versionsApi = {
  async getByProject(projectId) {
    const { data, error } = await supabase
      .from('versions')
      .select('*, profiles(name, avatar_initials)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async create(version) {
    const { data, error } = await supabase
      .from('versions')
      .insert(version)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('versions')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ── Comments ──────────────────────────────────────────────────────────────────

export const commentsApi = {
  async getByProject(projectId) {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(name, avatar_initials, role)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async create(comment) {
    const { data, error } = await supabase
      .from('comments')
      .insert(comment)
      .select('*, profiles(name, avatar_initials, role)')
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── Files ─────────────────────────────────────────────────────────────────────

export const filesApi = {
  async getByProject(projectId) {
    const { data, error } = await supabase
      .from('files')
      .select('*, profiles(name)')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async upload(projectId, authorId, file) {
    const ext = file.name.split('.').pop();
    const path = `${projectId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(path, file);
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('project-files')
      .getPublicUrl(path);

    const { data, error } = await supabase
      .from('files')
      .insert({
        project_id: projectId,
        author_id: authorId,
        name: file.name,
        type: file.type,
        size: file.size,
        storage_path: path,
        public_url: urlData.publicUrl,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id, storagePath) {
    await supabase.storage.from('project-files').remove([storagePath]);
    const { error } = await supabase.from('files').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationsApi = {
  async getByUser(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    if (error) throw error;
    return data;
  },

  async markRead(id) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);
    if (error) throw error;
  },

  async markAllRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId);
    if (error) throw error;
  },

  async create(notification) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  subscribeToUser(userId, callback) {
    return supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, callback)
      .subscribe();
  },
};

// ── Events ────────────────────────────────────────────────────────────────────

export const eventsApi = {
  async getAll(userId, role) {
    let query = supabase
      .from('events')
      .select('*, projects(title)')
      .order('date', { ascending: true });

    if (role === 'aluno') {
      query = query.or(`user_id.eq.${userId},user_id.is.null`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async create(event) {
    const { data, error } = await supabase
      .from('events')
      .insert(event)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── Activity ──────────────────────────────────────────────────────────────────

export const activityApi = {
  async getRecent(limit = 20) {
    const { data, error } = await supabase
      .from('activity')
      .select('*, profiles(name, avatar_initials)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async log(entry) {
    const { error } = await supabase.from('activity').insert(entry);
    if (error) console.error('Activity log error:', error);
  },
};

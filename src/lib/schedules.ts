import { supabase } from './supabase';

export interface Schedule {
  id: string;
  pharmacist_id: string;
  pharmacy_id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  break_duration: number; // 休憩時間（分）
  work_type: 'regular' | 'overtime' | 'holiday' | 'emergency';
  work_location?: string;
  work_description?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  created_by?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  pharmacist?: {
    first_name: string;
    last_name: string;
    user_id: string;
  };
}

export interface CreateScheduleData {
  pharmacist_id: string;
  pharmacy_id: string;
  schedule_date: string;
  start_time: string;
  end_time: string;
  break_duration?: number;
  work_type?: 'regular' | 'overtime' | 'holiday' | 'emergency';
  work_location?: string;
  work_description?: string;
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

export interface UpdateScheduleData {
  schedule_date?: string;
  start_time?: string;
  end_time?: string;
  break_duration?: number;
  work_type?: 'regular' | 'overtime' | 'holiday' | 'emergency';
  work_location?: string;
  work_description?: string;
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

export const scheduleService = {
  // Get schedules for a specific date range
  async getSchedules(startDate: string, endDate: string, pharmacistId?: string) {
    let query = supabase
      .from('schedules')
      .select(`
        *,
        pharmacist:pharmacists(
          first_name,
          last_name,
          user_id
        )
      `)
      .gte('schedule_date', startDate)
      .lte('schedule_date', endDate)
      .order('schedule_date', { ascending: true })
      .order('start_time', { ascending: true });

    if (pharmacistId) {
      query = query.eq('pharmacist_id', pharmacistId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`スケジュール情報の取得に失敗しました: ${error.message}`);
    }

    return data as Schedule[];
  },

  // Get schedules for a specific month
  async getMonthlySchedules(year: number, month: number, pharmacistId?: string) {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    return this.getSchedules(startDate, endDate, pharmacistId);
  },

  // Get schedules for a specific week
  async getWeeklySchedules(date: Date, pharmacistId?: string) {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startDate = startOfWeek.toISOString().split('T')[0];
    const endDate = endOfWeek.toISOString().split('T')[0];

    return this.getSchedules(startDate, endDate, pharmacistId);
  },

  // Get schedules for a specific day
  async getDailySchedules(date: string, pharmacistId?: string) {
    return this.getSchedules(date, date, pharmacistId);
  },

  // Create a new schedule
  async createSchedule(scheduleData: CreateScheduleData) {
    const { data, error } = await supabase
      .from('schedules')
      .insert({
        ...scheduleData,
        break_duration: scheduleData.break_duration || 0,
        status: scheduleData.status || 'scheduled',
        work_type: scheduleData.work_type || 'regular',
      })
      .select(`
        *,
        pharmacist:pharmacists(
          first_name,
          last_name,
          user_id
        )
      `)
      .single();

    if (error) {
      throw new Error(`スケジュールの作成に失敗しました: ${error.message}`);
    }

    return data as Schedule;
  },

  // Update an existing schedule
  async updateSchedule(scheduleId: string, scheduleData: UpdateScheduleData) {
    const { data, error } = await supabase
      .from('schedules')
      .update(scheduleData)
      .eq('id', scheduleId)
      .select(`
        *,
        pharmacist:pharmacists(
          first_name,
          last_name,
          user_id
        )
      `)
      .single();

    if (error) {
      throw new Error(`スケジュールの更新に失敗しました: ${error.message}`);
    }

    return data as Schedule;
  },

  // Delete a schedule
  async deleteSchedule(scheduleId: string) {
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', scheduleId);

    if (error) {
      throw new Error(`スケジュールの削除に失敗しました: ${error.message}`);
    }
  },

  // Get available pharmacists for a specific time slot
  async getAvailablePharmacists(date: string, startTime: string, endTime: string) {
    // First get all pharmacists
    const { data: pharmacists, error: pharmacistError } = await supabase
      .from('pharmacists')
      .select('id, first_name, last_name, user_id');

    if (pharmacistError) {
      throw new Error(`薬剤師情報の取得に失敗しました: ${pharmacistError.message}`);
    }

    // Then check for conflicts with existing schedules
    const { data: conflictingSchedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('pharmacist_id')
      .eq('schedule_date', date)
      .neq('status', 'cancelled')
      .or(`start_time.lte.${endTime},end_time.gte.${startTime}`);

    if (scheduleError) {
      throw new Error(`スケジュール競合チェックに失敗しました: ${scheduleError.message}`);
    }

    const conflictingPharmacistIds = conflictingSchedules?.map(schedule => schedule.pharmacist_id) || [];
    
    return pharmacists?.filter(pharmacist => 
      !conflictingPharmacistIds.includes(pharmacist.id)
    ) || [];
  },

  // Calculate working hours for a schedule
  calculateWorkingHours(schedule: Schedule): number {
    const startTime = new Date(`2000-01-01T${schedule.start_time}`);
    const endTime = new Date(`2000-01-01T${schedule.end_time}`);
    const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const workingMinutes = totalMinutes - schedule.break_duration;
    return workingMinutes / 60; // Return hours
  },

  // Get schedule statistics for a pharmacist
  async getScheduleStatistics(pharmacistId: string, startDate: string, endDate: string) {
    const schedules = await this.getSchedules(startDate, endDate, pharmacistId);
    
    const totalSchedules = schedules.length;
    const completedSchedules = schedules.filter(schedule => schedule.status === 'completed').length;
    const totalHours = schedules.reduce((sum, schedule) => sum + this.calculateWorkingHours(schedule), 0);
    
    return {
      totalSchedules,
      completedSchedules,
      totalHours,
      averageHoursPerSchedule: totalSchedules > 0 ? totalHours / totalSchedules : 0,
    };
  }
};
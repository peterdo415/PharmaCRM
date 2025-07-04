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
  user_id: string; // 薬剤師のuser_id（認証条件用、schedulesテーブルには保存されない）
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

export interface ScheduleChangeHistory {
  id: string;
  schedule_id: string;
  change_type: 'update' | 'cancel' | 'reschedule' | 'substitute';
  changed_by: string;
  change_reason?: string;
  old_schedule_date?: string;
  old_start_time?: string;
  old_end_time?: string;
  old_work_location?: string;
  old_work_description?: string;
  old_status?: string;
  old_pharmacist_id?: string;
  new_schedule_date?: string;
  new_start_time?: string;
  new_end_time?: string;
  new_work_location?: string;
  new_work_description?: string;
  new_status?: string;
  new_pharmacist_id?: string;
  suggested_pharmacist_id?: string;
  substitute_accepted?: boolean;
  created_at: string;
}

export interface ScheduleCancelData {
  reason?: string;
  suggestSubstitute?: boolean;
}

export interface ScheduleRescheduleData {
  new_schedule_date: string;
  new_start_time: string;
  new_end_time: string;
  reason?: string;
}

export interface ScheduleSubstituteData {
  new_pharmacist_id: string;
  reason?: string;
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
    // Get current user
    const { data: user } = await supabase.auth.getUser();
    
    // user_idは認証用のみで、schedulesテーブルには保存しない
    const { user_id, ...scheduleInsertData } = scheduleData;
    
    const { data, error } = await supabase
      .from('schedules')
      .insert({
        ...scheduleInsertData,
        break_duration: scheduleData.break_duration || 0,
        status: scheduleData.status || 'scheduled',
        work_type: scheduleData.work_type || 'regular',
        created_by: user?.user?.id || null,
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

  // Get available pharmacists for a specific time slot with enhanced filtering
  async getAvailablePharmacists(date: string, startTime: string, endTime: string, pharmacyId?: string) {
    // First get all pharmacists (optionally filtered by pharmacy)
    let pharmacistQuery = supabase
      .from('pharmacists')
      .select(`
        id, 
        first_name, 
        last_name, 
        user_id, 
        pharmacy_id,
        experience_years,
        pharmacist_specialties(
          specialty_id,
          experience_level,
          specialties(name)
        )
      `);

    if (pharmacyId) {
      pharmacistQuery = pharmacistQuery.eq('pharmacy_id', pharmacyId);
    }

    const { data: pharmacists, error: pharmacistError } = await pharmacistQuery;

    if (pharmacistError) {
      throw new Error(`薬剤師情報の取得に失敗しました: ${pharmacistError.message}`);
    }

    // Check for conflicts with existing schedules
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
    
    // Filter out conflicting pharmacists and sort by experience and specialties
    const availablePharmacists = pharmacists?.filter(pharmacist => 
      !conflictingPharmacistIds.includes(pharmacist.id)
    ) || [];

    // Sort by experience and number of specialties (prioritize more experienced pharmacists)
    return availablePharmacists.sort((a, b) => {
      const aSpecialties = (a as any).pharmacist_specialties?.length || 0;
      const bSpecialties = (b as any).pharmacist_specialties?.length || 0;
      const aExperience = a.experience_years || 0;
      const bExperience = b.experience_years || 0;
      
      // First sort by experience, then by number of specialties
      if (bExperience !== aExperience) {
        return bExperience - aExperience;
      }
      return bSpecialties - aSpecialties;
    });
  },

  // Get smart substitute suggestions based on the original pharmacist's profile
  async getSmartSubstituteSuggestions(scheduleId: string) {
    // Get the original schedule with pharmacist details
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select(`
        *,
        pharmacist:pharmacists(
          id,
          first_name,
          last_name,
          experience_years,
          pharmacy_id,
          pharmacist_specialties(
            specialty_id,
            experience_level,
            specialties(name)
          )
        )
      `)
      .eq('id', scheduleId)
      .single();

    if (scheduleError) {
      throw new Error(`スケジュール情報の取得に失敗しました: ${scheduleError.message}`);
    }

    const originalPharmacist = (schedule as any).pharmacist;
    if (!originalPharmacist) {
      throw new Error('元の薬剤師情報が見つかりません');
    }

    // Get available pharmacists from the same pharmacy
    const availablePharmacists = await this.getAvailablePharmacists(
      schedule.schedule_date,
      schedule.start_time,
      schedule.end_time,
      originalPharmacist.pharmacy_id
    );

    // Calculate compatibility score for each available pharmacist
    const scoredPharmacists = availablePharmacists.map(pharmacist => {
      let compatibilityScore = 0;
      const pharmacistData = pharmacist as any;

      // Experience level matching (30% weight)
      const experienceDiff = Math.abs((pharmacistData.experience_years || 0) - (originalPharmacist.experience_years || 0));
      const experienceScore = Math.max(0, 10 - experienceDiff);
      compatibilityScore += experienceScore * 0.3;

      // Specialty matching (40% weight)
      const originalSpecialties = originalPharmacist.pharmacist_specialties?.map((ps: any) => ps.specialty_id) || [];
      const candidateSpecialties = pharmacistData.pharmacist_specialties?.map((ps: any) => ps.specialty_id) || [];
      
      const commonSpecialties = originalSpecialties.filter((specialty: string) => 
        candidateSpecialties.includes(specialty)
      );
      const specialtyScore = originalSpecialties.length > 0 
        ? (commonSpecialties.length / originalSpecialties.length) * 10
        : 5; // Default score if no specialties
      compatibilityScore += specialtyScore * 0.4;

      // Base availability score (30% weight)
      compatibilityScore += 3; // Base score for being available

      return {
        ...pharmacist,
        compatibilityScore: Math.round(compatibilityScore * 10) / 10,
        commonSpecialties: commonSpecialties.length,
        experienceDiff
      };
    });

    // Sort by compatibility score (highest first)
    return scoredPharmacists.sort((a, b) => (b as any).compatibilityScore - (a as any).compatibilityScore);
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
  },

  // Cancel a schedule
  async cancelSchedule(scheduleId: string, cancelData: ScheduleCancelData) {
    const { error } = await supabase
      .from('schedules')
      .update({ status: 'cancelled' })
      .eq('id', scheduleId);

    if (error) {
      throw new Error(`スケジュールのキャンセルに失敗しました: ${error.message}`);
    }

    // If requesting substitute suggestion, log it in change history
    if (cancelData.suggestSubstitute) {
      await this.logChangeHistory(scheduleId, 'cancel', cancelData.reason, {
        suggestSubstitute: true
      });
    }
  },

  // Reschedule a schedule
  async rescheduleSchedule(scheduleId: string, rescheduleData: ScheduleRescheduleData) {
    const { data, error } = await supabase
      .from('schedules')
      .update({
        schedule_date: rescheduleData.new_schedule_date,
        start_time: rescheduleData.new_start_time,
        end_time: rescheduleData.new_end_time,
      })
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
      throw new Error(`スケジュールの変更に失敗しました: ${error.message}`);
    }

    return data as Schedule;
  },

  // Substitute pharmacist for a schedule
  async substitutePharmacist(scheduleId: string, substituteData: ScheduleSubstituteData) {
    const { data, error } = await supabase
      .from('schedules')
      .update({
        pharmacist_id: substituteData.new_pharmacist_id,
      })
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
      throw new Error(`代替薬剤師の設定に失敗しました: ${error.message}`);
    }

    return data as Schedule;
  },

  // Get suggested substitute pharmacists
  async getSuggestedSubstitutes(scheduleId: string) {
    // Get the original schedule
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (scheduleError) {
      throw new Error(`スケジュール情報の取得に失敗しました: ${scheduleError.message}`);
    }

    // Get available pharmacists for the same time slot
    return this.getAvailablePharmacists(
      schedule.schedule_date,
      schedule.start_time,
      schedule.end_time
    );
  },

  // Log change history manually (for cases where trigger doesn't capture all info)
  async logChangeHistory(scheduleId: string, changeType: string, reason?: string, extraData?: any) {
    const { error } = await supabase
      .from('schedule_change_history')
      .insert({
        schedule_id: scheduleId,
        change_type: changeType,
        changed_by: (await supabase.auth.getUser()).data.user?.id,
        change_reason: reason,
        ...extraData
      });

    if (error) {
      console.error('Failed to log change history:', error);
      // Don't throw error as this is not critical
    }
  },

  // Get change history for a schedule
  async getScheduleChangeHistory(scheduleId: string): Promise<ScheduleChangeHistory[]> {
    const { data, error } = await supabase
      .from('schedule_change_history')
      .select(`
        *,
        changed_user:auth.users!changed_by(email),
        old_pharmacist:pharmacists!old_pharmacist_id(first_name, last_name),
        new_pharmacist:pharmacists!new_pharmacist_id(first_name, last_name),
        suggested_pharmacist:pharmacists!suggested_pharmacist_id(first_name, last_name)
      `)
      .eq('schedule_id', scheduleId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`変更履歴の取得に失敗しました: ${error.message}`);
    }

    return data as ScheduleChangeHistory[];
  }
};
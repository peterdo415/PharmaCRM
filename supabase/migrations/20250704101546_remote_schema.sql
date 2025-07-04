-- authスキーマ

drop policy "pharmacies_update_admin_mgr" on "public"."pharmacies";

drop policy "pharmacists_insert_auth" on "public"."pharmacists";

drop policy "pharmacists_update_auth" on "public"."pharmacists";

drop policy "Users can create schedule change history for their pharmacy" on "public"."schedule_change_history";

drop policy "Users can delete schedule change history" on "public"."schedule_change_history";

drop policy "Users can update schedule change history" on "public"."schedule_change_history";

drop policy "Users can delete schedules" on "public"."schedules";

drop policy "Users can insert schedules" on "public"."schedules";

drop policy "Users can update schedules" on "public"."schedules";

drop policy "schedules_insert_policy" on "public"."schedules";

drop policy "schedules_update_policy" on "public"."schedules";

alter table "public"."certifications" drop constraint "certifications_certification_type_check";

alter table "public"."pharmacist_specialties" drop constraint "pharmacist_specialties_experience_level_check";

alter table "public"."pharmacists" drop constraint "pharmacists_employment_type_check";

alter table "public"."pharmacists" drop constraint "pharmacists_gender_check";

alter table "public"."schedule_change_history" drop constraint "schedule_change_history_change_type_check";

alter table "public"."schedules" drop constraint "schedules_status_check";

alter table "public"."schedules" drop constraint "schedules_work_type_check";

alter table "public"."shift_requests" drop constraint "shift_requests_priority_check";

alter table "public"."shift_requests" drop constraint "shift_requests_request_type_check";

alter table "public"."shift_requests" drop constraint "shift_requests_status_check";

alter table "public"."user_roles" drop constraint "user_roles_role_check";

alter table "public"."work_records" drop constraint "work_records_status_check";

alter table "public"."certifications" add constraint "certifications_certification_type_check" CHECK (((certification_type)::text = ANY ((ARRAY['certified'::character varying, 'specialist'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "public"."certifications" validate constraint "certifications_certification_type_check";

alter table "public"."pharmacist_specialties" add constraint "pharmacist_specialties_experience_level_check" CHECK (((experience_level)::text = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'instructor'::character varying])::text[]))) not valid;

alter table "public"."pharmacist_specialties" validate constraint "pharmacist_specialties_experience_level_check";

alter table "public"."pharmacists" add constraint "pharmacists_employment_type_check" CHECK (((employment_type)::text = ANY ((ARRAY['full_time'::character varying, 'part_time'::character varying, 'temporary'::character varying, 'dispatch'::character varying])::text[]))) not valid;

alter table "public"."pharmacists" validate constraint "pharmacists_employment_type_check";

alter table "public"."pharmacists" add constraint "pharmacists_gender_check" CHECK (((gender)::text = ANY ((ARRAY['male'::character varying, 'female'::character varying, 'other'::character varying])::text[]))) not valid;

alter table "public"."pharmacists" validate constraint "pharmacists_gender_check";

alter table "public"."schedule_change_history" add constraint "schedule_change_history_change_type_check" CHECK (((change_type)::text = ANY ((ARRAY['update'::character varying, 'cancel'::character varying, 'reschedule'::character varying, 'substitute'::character varying])::text[]))) not valid;

alter table "public"."schedule_change_history" validate constraint "schedule_change_history_change_type_check";

alter table "public"."schedules" add constraint "schedules_status_check" CHECK (((status)::text = ANY ((ARRAY['scheduled'::character varying, 'confirmed'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."schedules" validate constraint "schedules_status_check";

alter table "public"."schedules" add constraint "schedules_work_type_check" CHECK (((work_type)::text = ANY ((ARRAY['regular'::character varying, 'overtime'::character varying, 'holiday'::character varying, 'emergency'::character varying])::text[]))) not valid;

alter table "public"."schedules" validate constraint "schedules_work_type_check";

alter table "public"."shift_requests" add constraint "shift_requests_priority_check" CHECK (((priority)::text = ANY ((ARRAY['required'::character varying, 'preferred'::character varying, 'available'::character varying])::text[]))) not valid;

alter table "public"."shift_requests" validate constraint "shift_requests_priority_check";

alter table "public"."shift_requests" add constraint "shift_requests_request_type_check" CHECK (((request_type)::text = ANY ((ARRAY['work_request'::character varying, 'leave_request'::character varying, 'preferred_time'::character varying])::text[]))) not valid;

alter table "public"."shift_requests" validate constraint "shift_requests_request_type_check";

alter table "public"."shift_requests" add constraint "shift_requests_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))) not valid;

alter table "public"."shift_requests" validate constraint "shift_requests_status_check";

alter table "public"."user_roles" add constraint "user_roles_role_check" CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying, 'pharmacist'::character varying])::text[]))) not valid;

alter table "public"."user_roles" validate constraint "user_roles_role_check";

alter table "public"."work_records" add constraint "work_records_status_check" CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[]))) not valid;

alter table "public"."work_records" validate constraint "work_records_status_check";

create policy "pharmacies_update_admin_mgr"
on "public"."pharmacies"
as permissive
for update
to authenticated
using ((id IN ( SELECT user_roles.pharmacy_id
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying])::text[]))))))
with check (true);


create policy "pharmacists_insert_auth"
on "public"."pharmacists"
as permissive
for insert
to authenticated
with check (((user_id = auth.uid()) OR (pharmacy_id IN ( SELECT user_roles.pharmacy_id
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying])::text[])))))));


create policy "pharmacists_update_auth"
on "public"."pharmacists"
as permissive
for update
to authenticated
using (((user_id = auth.uid()) OR (pharmacy_id IN ( SELECT user_roles.pharmacy_id
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying])::text[])))))))
with check (true);


create policy "Users can create schedule change history for their pharmacy"
on "public"."schedule_change_history"
as permissive
for insert
to public
with check (((EXISTS ( SELECT 1
   FROM ((schedules s
     JOIN pharmacists p ON ((s.pharmacist_id = p.id)))
     JOIN user_roles ur ON ((p.pharmacy_id = ur.pharmacy_id)))
  WHERE ((s.id = schedule_change_history.schedule_id) AND (ur.user_id = auth.uid()) AND ((ur.role)::text = ANY ((ARRAY['pharmacy_admin'::character varying, 'manager'::character varying])::text[]))))) OR (changed_by = auth.uid())));


create policy "Users can delete schedule change history"
on "public"."schedule_change_history"
as permissive
for delete
to public
using (((changed_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM ((schedules s
     JOIN pharmacists p ON ((s.pharmacist_id = p.id)))
     JOIN user_roles ur ON ((p.pharmacy_id = ur.pharmacy_id)))
  WHERE ((s.id = schedule_change_history.schedule_id) AND (ur.user_id = auth.uid()) AND ((ur.role)::text = ANY ((ARRAY['pharmacy_admin'::character varying, 'manager'::character varying])::text[])))))));


create policy "Users can update schedule change history"
on "public"."schedule_change_history"
as permissive
for update
to public
using (((changed_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM ((schedules s
     JOIN pharmacists p ON ((s.pharmacist_id = p.id)))
     JOIN user_roles ur ON ((p.pharmacy_id = ur.pharmacy_id)))
  WHERE ((s.id = schedule_change_history.schedule_id) AND (ur.user_id = auth.uid()) AND ((ur.role)::text = ANY ((ARRAY['pharmacy_admin'::character varying, 'manager'::character varying])::text[])))))))
with check ((changed_by = auth.uid()));


create policy "Users can delete schedules"
on "public"."schedules"
as permissive
for delete
to public
using (((EXISTS ( SELECT 1
   FROM (pharmacists p
     JOIN user_roles ur ON ((p.pharmacy_id = ur.pharmacy_id)))
  WHERE ((p.id = schedules.pharmacist_id) AND (ur.user_id = auth.uid()) AND ((ur.role)::text = ANY ((ARRAY['pharmacy_admin'::character varying, 'manager'::character varying])::text[]))))) OR (EXISTS ( SELECT 1
   FROM pharmacists p
  WHERE ((p.id = schedules.pharmacist_id) AND (p.user_id = auth.uid()))))));


create policy "Users can insert schedules"
on "public"."schedules"
as permissive
for insert
to public
with check (((EXISTS ( SELECT 1
   FROM pharmacists p
  WHERE ((p.id = schedules.pharmacist_id) AND (p.user_id = auth.uid()) AND (p.pharmacy_id = schedules.pharmacy_id)))) OR (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN pharmacists p2 ON ((p2.pharmacy_id = ur.pharmacy_id)))
  WHERE ((ur.user_id = auth.uid()) AND ((ur.role)::text = ANY ((ARRAY['pharmacy_admin'::character varying, 'manager'::character varying])::text[])) AND (p2.id = schedules.pharmacist_id) AND (p2.pharmacy_id = schedules.pharmacy_id))))));


create policy "Users can update schedules"
on "public"."schedules"
as permissive
for update
to public
using (((EXISTS ( SELECT 1
   FROM (pharmacists p
     JOIN user_roles ur ON ((p.pharmacy_id = ur.pharmacy_id)))
  WHERE ((p.id = schedules.pharmacist_id) AND (ur.user_id = auth.uid()) AND ((ur.role)::text = ANY ((ARRAY['pharmacy_admin'::character varying, 'manager'::character varying])::text[]))))) OR (EXISTS ( SELECT 1
   FROM pharmacists p
  WHERE ((p.id = schedules.pharmacist_id) AND (p.user_id = auth.uid()))))))
with check ((pharmacy_id = ( SELECT pharmacists.pharmacy_id
   FROM pharmacists
  WHERE (pharmacists.id = schedules.pharmacist_id))));


create policy "schedules_insert_policy"
on "public"."schedules"
as permissive
for insert
to authenticated
with check (((pharmacist_id IN ( SELECT pharmacists.id
   FROM pharmacists
  WHERE (pharmacists.user_id = auth.uid()))) OR ((pharmacy_id IS NOT NULL) AND (pharmacy_id IN ( SELECT user_roles.pharmacy_id
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying])::text[]))))))));


create policy "schedules_update_policy"
on "public"."schedules"
as permissive
for update
to authenticated
using (((created_by = auth.uid()) OR (pharmacy_id IN ( SELECT user_roles.pharmacy_id
   FROM user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = ANY ((ARRAY['admin'::character varying, 'manager'::character varying])::text[])))))))
with check (true);




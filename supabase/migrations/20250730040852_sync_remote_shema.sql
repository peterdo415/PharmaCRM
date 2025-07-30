--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.5 (Homebrew)

-- SET statement_timeout = 0;
-- SET lock_timeout = 0;
-- SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
-- SET client_encoding = 'UTF8';
-- SET standard_conforming_strings = on;
-- SELECT pg_catalog.set_config('search_path', '', false);
-- SET check_function_bodies = false;
-- SET xmloption = content;
-- SET client_min_messages = warning;
-- SET row_security = off;

-- SET default_tablespace = '';

-- SET default_table_access_method = heap;

--
-- Name: certifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.certifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pharmacist_id uuid,
    certification_name character varying(200) NOT NULL,
    certification_type character varying(50),
    issuing_organization character varying(200),
    certification_number character varying(100),
    issue_date date,
    expiry_date date,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT certifications_certification_type_check CHECK (((certification_type)::text = ANY (ARRAY[('certified'::character varying)::text, ('specialist'::character varying)::text, ('other'::character varying)::text])))
);


ALTER TABLE public.certifications OWNER TO postgres;

--
-- Name: pharmacies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pharmacies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    address text,
    phone_number character varying(20),
    email character varying(255),
    license_number character varying(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    postal_code character varying(10),
    prefecture character varying(50),
    city character varying(100),
    fax_number character varying(15),
    pharmacy_email character varying(255) NOT NULL,
    pharmacy_license_number character varying(20) NOT NULL,
    created_by uuid DEFAULT auth.uid() NOT NULL,
    CONSTRAINT check_fax_format CHECK (((fax_number IS NULL) OR ((fax_number)::text ~ '^[0-9-]+$'::text))),
    CONSTRAINT check_fax_number_format CHECK (((fax_number)::text ~ '^[0-9-]+$'::text)),
    CONSTRAINT check_pharmacy_email_format CHECK (((pharmacy_email)::text ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text)),
    CONSTRAINT check_pharmacy_license_format CHECK (((pharmacy_license_number)::text ~ '^[一-龥ぁ-んァ-ヶA-Za-z]{1,10}\s?保?\s?第[0-9]{1,9}号$'::text))
);


ALTER TABLE public.pharmacies OWNER TO postgres;

--
-- Name: COLUMN pharmacies.email; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pharmacies.email IS '管理者メールアドレス（認証用）';


--
-- Name: COLUMN pharmacies.fax_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pharmacies.fax_number IS 'FAX番号（任意）';


--
-- Name: COLUMN pharmacies.pharmacy_email; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pharmacies.pharmacy_email IS '薬局代表メールアドレス（必須）';


--
-- Name: COLUMN pharmacies.pharmacy_license_number; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pharmacies.pharmacy_license_number IS '薬局免許番号（必須・ユニーク・形式: 「県略号保 第n号」）';


--
-- Name: pharmacist_availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pharmacist_availability (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pharmacist_id uuid,
    day_of_week integer,
    start_time time without time zone,
    end_time time without time zone,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pharmacist_availability_day_of_week_check CHECK (((day_of_week >= 0) AND (day_of_week <= 6)))
);


ALTER TABLE public.pharmacist_availability OWNER TO postgres;

--
-- Name: pharmacist_specialties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pharmacist_specialties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pharmacist_id uuid,
    specialty_id uuid,
    experience_level character varying(20),
    years_of_experience integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pharmacist_specialties_experience_level_check CHECK (((experience_level)::text = ANY (ARRAY[('beginner'::character varying)::text, ('intermediate'::character varying)::text, ('advanced'::character varying)::text, ('instructor'::character varying)::text])))
);


ALTER TABLE public.pharmacist_specialties OWNER TO postgres;

--
-- Name: pharmacists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pharmacists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    pharmacy_id uuid,
    last_name character varying(100) NOT NULL,
    first_name character varying(100) NOT NULL,
    birth_date date,
    gender character varying(10),
    phone_mobile character varying(20),
    phone_home character varying(20),
    email character varying(255),
    postal_code character varying(10),
    prefecture character varying(50),
    city character varying(100),
    address text,
    license_number character varying(100) NOT NULL,
    license_date date,
    experience_years integer DEFAULT 0,
    photo_url text,
    emergency_contact_name character varying(100),
    emergency_contact_phone character varying(20),
    nearest_station character varying(100),
    transportation character varying(50),
    employment_type character varying(50),
    hourly_rate integer,
    daily_rate integer,
    transport_allowance boolean DEFAULT false,
    min_work_hours integer,
    max_consecutive_days integer,
    night_shift_available boolean DEFAULT false,
    weekend_available boolean DEFAULT false,
    holiday_available boolean DEFAULT false,
    emergency_available boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    emergency_contact_relation text,
    first_name_kana character varying(50),
    last_name_kana character varying(50),
    CONSTRAINT pharmacists_employment_type_check CHECK (((employment_type)::text = ANY (ARRAY[('full_time'::character varying)::text, ('part_time'::character varying)::text, ('temporary'::character varying)::text, ('dispatch'::character varying)::text]))),
    CONSTRAINT pharmacists_gender_check CHECK (((gender)::text = ANY (ARRAY[('male'::character varying)::text, ('female'::character varying)::text, ('other'::character varying)::text])))
);


ALTER TABLE public.pharmacists OWNER TO postgres;

--
-- Name: COLUMN pharmacists.emergency_contact_relation; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pharmacists.emergency_contact_relation IS '緊急連絡先との続柄 (Relationship to emergency contact)';


--
-- Name: schedule_change_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schedule_change_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    schedule_id uuid NOT NULL,
    change_type character varying(50) NOT NULL,
    changed_by uuid NOT NULL,
    change_reason text,
    old_schedule_date date,
    old_start_time time without time zone,
    old_end_time time without time zone,
    old_work_location text,
    old_work_description text,
    old_status text,
    old_pharmacist_id uuid,
    new_schedule_date date,
    new_start_time time without time zone,
    new_end_time time without time zone,
    new_work_location text,
    new_work_description text,
    new_status text,
    new_pharmacist_id uuid,
    suggested_pharmacist_id uuid,
    substitute_accepted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT schedule_change_history_change_type_check CHECK (((change_type)::text = ANY (ARRAY[('update'::character varying)::text, ('cancel'::character varying)::text, ('reschedule'::character varying)::text, ('substitute'::character varying)::text])))
);


ALTER TABLE public.schedule_change_history OWNER TO postgres;

--
-- Name: schedules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schedules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pharmacist_id uuid,
    pharmacy_id uuid,
    schedule_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    break_duration integer DEFAULT 0,
    work_type character varying(50),
    work_location character varying(100),
    work_description text,
    status character varying(20) DEFAULT 'scheduled'::character varying,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT schedules_status_check CHECK (((status)::text = ANY (ARRAY[('scheduled'::character varying)::text, ('confirmed'::character varying)::text, ('completed'::character varying)::text, ('cancelled'::character varying)::text]))),
    CONSTRAINT schedules_work_type_check CHECK (((work_type)::text = ANY (ARRAY[('regular'::character varying)::text, ('overtime'::character varying)::text, ('holiday'::character varying)::text, ('emergency'::character varying)::text])))
);


ALTER TABLE public.schedules OWNER TO postgres;

--
-- Name: shift_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shift_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pharmacist_id uuid,
    pharmacy_id uuid,
    request_month date NOT NULL,
    request_date date NOT NULL,
    request_type character varying(20),
    start_time time without time zone,
    end_time time without time zone,
    priority character varying(20) DEFAULT 'preferred'::character varying,
    notes text,
    status character varying(20) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT shift_requests_priority_check CHECK (((priority)::text = ANY (ARRAY[('required'::character varying)::text, ('preferred'::character varying)::text, ('available'::character varying)::text]))),
    CONSTRAINT shift_requests_request_type_check CHECK (((request_type)::text = ANY (ARRAY[('work_request'::character varying)::text, ('leave_request'::character varying)::text, ('preferred_time'::character varying)::text]))),
    CONSTRAINT shift_requests_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text])))
);


ALTER TABLE public.shift_requests OWNER TO postgres;

--
-- Name: specialties; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.specialties (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    category character varying(50),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.specialties OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    pharmacy_id uuid,
    role character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_roles_role_check CHECK (((role)::text = ANY (ARRAY[('admin'::character varying)::text, ('manager'::character varying)::text, ('pharmacist'::character varying)::text])))
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: work_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.work_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    pharmacist_id uuid,
    pharmacy_id uuid,
    schedule_id uuid,
    work_date date NOT NULL,
    actual_start_time time without time zone,
    actual_end_time time without time zone,
    actual_break_duration integer DEFAULT 0,
    actual_work_hours numeric(4,2),
    overtime_hours numeric(4,2) DEFAULT 0,
    prescription_count integer DEFAULT 0,
    counseling_count integer DEFAULT 0,
    home_visit_count integer DEFAULT 0,
    notes text,
    status character varying(20) DEFAULT 'pending'::character varying,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT work_records_status_check CHECK (((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('approved'::character varying)::text, ('rejected'::character varying)::text])))
);


ALTER TABLE public.work_records OWNER TO postgres;


--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.5 (Homebrew)

-- SET statement_timeout = 0;
-- SET lock_timeout = 0;
-- SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
-- SET client_encoding = 'UTF8';
-- SET standard_conforming_strings = on;
-- SELECT pg_catalog.set_config('search_path', '', false);
-- SET check_function_bodies = false;
-- SET xmloption = content;
-- SET client_min_messages = warning;
-- SET row_security = off;

-- SET default_tablespace = '';

--
-- Name: certifications certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_pkey PRIMARY KEY (id);


--
-- Name: pharmacies pharmacies_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacies
    ADD CONSTRAINT pharmacies_name_key UNIQUE (name);


--
-- Name: pharmacies pharmacies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacies
    ADD CONSTRAINT pharmacies_pkey PRIMARY KEY (id);


--
-- Name: pharmacist_availability pharmacist_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacist_availability
    ADD CONSTRAINT pharmacist_availability_pkey PRIMARY KEY (id);


--
-- Name: pharmacist_specialties pharmacist_specialties_pharmacist_id_specialty_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacist_specialties
    ADD CONSTRAINT pharmacist_specialties_pharmacist_id_specialty_id_key UNIQUE (pharmacist_id, specialty_id);


--
-- Name: pharmacist_specialties pharmacist_specialties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacist_specialties
    ADD CONSTRAINT pharmacist_specialties_pkey PRIMARY KEY (id);


--
-- Name: pharmacists pharmacists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacists
    ADD CONSTRAINT pharmacists_pkey PRIMARY KEY (id);


--
-- Name: pharmacists pharmacists_user_id_pharmacy_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacists
    ADD CONSTRAINT pharmacists_user_id_pharmacy_id_key UNIQUE (user_id, pharmacy_id);


--
-- Name: schedule_change_history schedule_change_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_change_history
    ADD CONSTRAINT schedule_change_history_pkey PRIMARY KEY (id);


--
-- Name: schedules schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_pkey PRIMARY KEY (id);


--
-- Name: shift_requests shift_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_requests
    ADD CONSTRAINT shift_requests_pkey PRIMARY KEY (id);


--
-- Name: specialties specialties_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specialties
    ADD CONSTRAINT specialties_name_key UNIQUE (name);


--
-- Name: specialties specialties_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.specialties
    ADD CONSTRAINT specialties_pkey PRIMARY KEY (id);


--
-- Name: pharmacies unique_pharmacy_license_number; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacies
    ADD CONSTRAINT unique_pharmacy_license_number UNIQUE (pharmacy_license_number);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_pharmacy_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_pharmacy_id_key UNIQUE (user_id, pharmacy_id);


--
-- Name: work_records work_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_records
    ADD CONSTRAINT work_records_pkey PRIMARY KEY (id);


--
-- Name: idx_availability_pharmacist_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_availability_pharmacist_id ON public.pharmacist_availability USING btree (pharmacist_id);


--
-- Name: idx_certifications_pharmacist_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_certifications_pharmacist_id ON public.certifications USING btree (pharmacist_id);


--
-- Name: idx_pharmacies_fax; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pharmacies_fax ON public.pharmacies USING btree (fax_number);


--
-- Name: idx_pharmacies_pharmacy_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pharmacies_pharmacy_email ON public.pharmacies USING btree (pharmacy_email);


--
-- Name: idx_pharmacies_pharmacy_license_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pharmacies_pharmacy_license_number ON public.pharmacies USING btree (pharmacy_license_number);


--
-- Name: idx_pharmacist_specialties_pid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pharmacist_specialties_pid ON public.pharmacist_specialties USING btree (pharmacist_id);


--
-- Name: idx_pharmacists_pharmacy_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pharmacists_pharmacy_id ON public.pharmacists USING btree (pharmacy_id);


--
-- Name: idx_pharmacists_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pharmacists_user_id ON public.pharmacists USING btree (user_id);


--
-- Name: idx_schedule_change_history_change_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedule_change_history_change_type ON public.schedule_change_history USING btree (change_type);


--
-- Name: idx_schedule_change_history_changed_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedule_change_history_changed_by ON public.schedule_change_history USING btree (changed_by);


--
-- Name: idx_schedule_change_history_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedule_change_history_created_at ON public.schedule_change_history USING btree (created_at);


--
-- Name: idx_schedule_change_history_schedule_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedule_change_history_schedule_id ON public.schedule_change_history USING btree (schedule_id);


--
-- Name: idx_schedules_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedules_date ON public.schedules USING btree (schedule_date);


--
-- Name: idx_schedules_pharmacist_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedules_pharmacist_id ON public.schedules USING btree (pharmacist_id);


--
-- Name: idx_schedules_pharmacy_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_schedules_pharmacy_id ON public.schedules USING btree (pharmacy_id);


--
-- Name: idx_shift_requests_pharmacist_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shift_requests_pharmacist_id ON public.shift_requests USING btree (pharmacist_id);


--
-- Name: idx_shift_requests_pharmacy_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_shift_requests_pharmacy_id ON public.shift_requests USING btree (pharmacy_id);


--
-- Name: idx_user_roles_pharmacy_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_roles_pharmacy_id ON public.user_roles USING btree (pharmacy_id);


--
-- Name: idx_user_roles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);


--
-- Name: idx_work_records_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_records_date ON public.work_records USING btree (work_date);


--
-- Name: idx_work_records_pharmacist_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_records_pharmacist_id ON public.work_records USING btree (pharmacist_id);


--
-- Name: idx_work_records_pharmacy_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_work_records_pharmacy_id ON public.work_records USING btree (pharmacy_id);

-- ensure_user_role 関数定義
CREATE OR REPLACE FUNCTION "public"."ensure_user_role"(
  "user_uuid"  uuid,
  "user_role"  text
) RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
DECLARE
  user_role_exists BOOLEAN;
BEGIN
  -- Check if user_roles record exists
  SELECT EXISTS(SELECT 1 FROM user_roles WHERE user_id = user_uuid)
    INTO user_role_exists;

  -- If not exists, create it with provided role
  IF NOT user_role_exists THEN
    INSERT INTO user_roles (user_id, role)
      VALUES (user_uuid, user_role);
  END IF;
END;
$$;

-- get_user_pharmacies 関数定義
CREATE OR REPLACE FUNCTION "public"."get_user_pharmacies"(
  "user_uuid"  uuid
) RETURNS TABLE(
  pharmacy_id uuid,
  role        text
)
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT pharmacy_id, role
      FROM user_roles
     WHERE user_id = user_uuid;
END;
$$;

-- get_user_role 関数定義
CREATE OR REPLACE FUNCTION "public"."get_user_role"(
  "user_uuid"     uuid,
  "pharmacy_uuid" uuid
) RETURNS text
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT role
      FROM user_roles
     WHERE user_id = user_uuid
       AND pharmacy_id = pharmacy_uuid
     LIMIT 1
  );
END;
$$;

-- get_user_role_safe 関数定義
CREATE OR REPLACE FUNCTION "public"."get_user_role_safe"(
  "user_uuid" uuid
) RETURNS text
  LANGUAGE sql
  SECURITY DEFINER
AS $$
  SELECT role
    FROM user_roles
   WHERE user_id = user_uuid;
$$;

-- log_schedule_change トリガー関数定義
CREATE OR REPLACE FUNCTION "public"."log_schedule_change"() RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO schedule_change_history (
      schedule_id, change_type, changed_by,
      old_schedule_date, old_start_time, old_end_time,
      old_work_location, old_work_description, old_status, old_pharmacist_id,
      new_schedule_date, new_start_time, new_end_time,
      new_work_location, new_work_description, new_status, new_pharmacist_id
    ) VALUES (
      NEW.id,
      CASE
        WHEN OLD.status           <> NEW.status           AND NEW.status           = 'cancelled' THEN 'cancel'
        WHEN OLD.pharmacist_id    <> NEW.pharmacist_id                           THEN 'substitute'
        WHEN OLD.schedule_date    <> NEW.schedule_date
          OR OLD.start_time       <> NEW.start_time
          OR OLD.end_time         <> NEW.end_time                                  THEN 'reschedule'
        ELSE 'update'
      END,
      auth.uid(),
      OLD.schedule_date, OLD.start_time, OLD.end_time,
      OLD.work_location, OLD.work_description, OLD.status, OLD.pharmacist_id,
      NEW.schedule_date, NEW.start_time, NEW.end_time,
      NEW.work_location, NEW.work_description, NEW.status, NEW.pharmacist_id
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;


--
-- Name: schedules schedule_change_log_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER schedule_change_log_trigger AFTER UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.log_schedule_change();


--
-- Name: certifications certifications_pharmacist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_pharmacist_id_fkey FOREIGN KEY (pharmacist_id) REFERENCES public.pharmacists(id) ON DELETE CASCADE;


--
-- Name: pharmacist_availability pharmacist_availability_pharmacist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacist_availability
    ADD CONSTRAINT pharmacist_availability_pharmacist_id_fkey FOREIGN KEY (pharmacist_id) REFERENCES public.pharmacists(id) ON DELETE CASCADE;


--
-- Name: pharmacist_specialties pharmacist_specialties_pharmacist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacist_specialties
    ADD CONSTRAINT pharmacist_specialties_pharmacist_id_fkey FOREIGN KEY (pharmacist_id) REFERENCES public.pharmacists(id) ON DELETE CASCADE;


--
-- Name: pharmacist_specialties pharmacist_specialties_specialty_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacist_specialties
    ADD CONSTRAINT pharmacist_specialties_specialty_id_fkey FOREIGN KEY (specialty_id) REFERENCES public.specialties(id) ON DELETE CASCADE;


--
-- Name: pharmacists pharmacists_pharmacy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacists
    ADD CONSTRAINT pharmacists_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id) ON DELETE CASCADE;


--
-- Name: pharmacists pharmacists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pharmacists
    ADD CONSTRAINT pharmacists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: schedule_change_history schedule_change_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_change_history
    ADD CONSTRAINT schedule_change_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id);


--
-- Name: schedule_change_history schedule_change_history_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_change_history
    ADD CONSTRAINT schedule_change_history_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.schedules(id) ON DELETE CASCADE;


--
-- Name: schedule_change_history schedule_change_history_suggested_pharmacist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedule_change_history
    ADD CONSTRAINT schedule_change_history_suggested_pharmacist_id_fkey FOREIGN KEY (suggested_pharmacist_id) REFERENCES public.pharmacists(id);


--
-- Name: schedules schedules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: schedules schedules_pharmacist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_pharmacist_id_fkey FOREIGN KEY (pharmacist_id) REFERENCES public.pharmacists(id) ON DELETE CASCADE;


--
-- Name: schedules schedules_pharmacy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id) ON DELETE CASCADE;


--
-- Name: shift_requests shift_requests_pharmacist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_requests
    ADD CONSTRAINT shift_requests_pharmacist_id_fkey FOREIGN KEY (pharmacist_id) REFERENCES public.pharmacists(id) ON DELETE CASCADE;


--
-- Name: shift_requests shift_requests_pharmacy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shift_requests
    ADD CONSTRAINT shift_requests_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_pharmacy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: work_records work_records_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_records
    ADD CONSTRAINT work_records_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id);


--
-- Name: work_records work_records_pharmacist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_records
    ADD CONSTRAINT work_records_pharmacist_id_fkey FOREIGN KEY (pharmacist_id) REFERENCES public.pharmacists(id) ON DELETE CASCADE;


--
-- Name: work_records work_records_pharmacy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_records
    ADD CONSTRAINT work_records_pharmacy_id_fkey FOREIGN KEY (pharmacy_id) REFERENCES public.pharmacies(id) ON DELETE CASCADE;


--
-- Name: work_records work_records_schedule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_records
    ADD CONSTRAINT work_records_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.schedules(id) ON DELETE SET NULL;


--
-- Name: pharmacists Authenticated users can insert pharmacist data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can insert pharmacist data" ON public.pharmacists FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: pharmacies Authenticated users can insert pharmacy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can insert pharmacy" ON public.pharmacies FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: user_roles Authenticated users can insert role; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can insert role" ON public.user_roles FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: schedules Pharmacists can insert their own schedules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Pharmacists can insert their own schedules" ON public.schedules FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.pharmacists p
  WHERE ((p.id = schedules.pharmacist_id) AND (p.user_id = auth.uid()) AND (p.pharmacy_id = schedules.pharmacy_id)))));


--
-- Name: schedule_change_history Users can create schedule change history for their pharmacy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create schedule change history for their pharmacy" ON public.schedule_change_history FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM ((public.schedules s
     JOIN public.pharmacists p ON ((s.pharmacist_id = p.id)))
     JOIN public.user_roles ur ON ((p.pharmacy_id = ur.pharmacy_id)))
  WHERE ((s.id = schedule_change_history.schedule_id) AND (ur.user_id = auth.uid()) AND ((ur.role)::text = ANY (ARRAY[('pharmacy_admin'::character varying)::text, ('manager'::character varying)::text]))))) OR (changed_by = auth.uid())));


--
-- Name: schedule_change_history Users can delete schedule change history; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete schedule change history" ON public.schedule_change_history FOR DELETE USING (((changed_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM ((public.schedules s
     JOIN public.pharmacists p ON ((s.pharmacist_id = p.id)))
     JOIN public.user_roles ur ON ((p.pharmacy_id = ur.pharmacy_id)))
  WHERE ((s.id = schedule_change_history.schedule_id) AND (ur.user_id = auth.uid()) AND ((ur.role)::text = ANY (ARRAY[('pharmacy_admin'::character varying)::text, ('manager'::character varying)::text])))))));


--
-- Name: schedules Users can delete schedules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete schedules" ON public.schedules FOR DELETE USING (((EXISTS ( SELECT 1
   FROM (public.pharmacists p
     JOIN public.user_roles ur ON ((p.pharmacy_id = ur.pharmacy_id)))
  WHERE ((p.id = schedules.pharmacist_id) AND (ur.user_id = auth.uid()) AND ((ur.role)::text = ANY (ARRAY[('pharmacy_admin'::character varying)::text, ('manager'::character varying)::text]))))) OR (EXISTS ( SELECT 1
   FROM public.pharmacists p
  WHERE ((p.id = schedules.pharmacist_id) AND (p.user_id = auth.uid()))))));


--
-- Name: schedules Users can insert schedules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert schedules" ON public.schedules FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM public.pharmacists p
  WHERE ((p.id = schedules.pharmacist_id) AND (p.user_id = auth.uid()) AND (p.pharmacy_id = schedules.pharmacy_id)))) OR (EXISTS ( SELECT 1
   FROM (public.user_roles ur
     JOIN public.pharmacists p2 ON ((p2.pharmacy_id = ur.pharmacy_id)))
  WHERE ((ur.user_id = auth.uid()) AND ((ur.role)::text = ANY (ARRAY[('pharmacy_admin'::character varying)::text, ('manager'::character varying)::text])) AND (p2.id = schedules.pharmacist_id) AND (p2.pharmacy_id = schedules.pharmacy_id))))));


--
-- Name: user_roles Users can migrate their own role; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can migrate their own role" ON public.user_roles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: schedules Users can select schedules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can select schedules" ON public.schedules FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.pharmacists p
     JOIN public.user_roles ur ON ((p.pharmacy_id = ur.pharmacy_id)))
  WHERE ((p.id = schedules.pharmacist_id) AND (ur.user_id = auth.uid())))));


--
-- Name: schedule_change_history Users can update schedule change history; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update schedule change history" ON public.schedule_change_history FOR UPDATE USING (((changed_by = auth.uid()) OR (EXISTS ( SELECT 1
   FROM ((public.schedules s
     JOIN public.pharmacists p ON ((s.pharmacist_id = p.id)))
     JOIN public.user_roles ur ON ((p.pharmacy_id = ur.pharmacy_id)))
  WHERE ((s.id = schedule_change_history.schedule_id) AND (ur.user_id = auth.uid()) AND ((ur.role)::text = ANY (ARRAY[('pharmacy_admin'::character varying)::text, ('manager'::character varying)::text]))))))) WITH CHECK ((changed_by = auth.uid()));


--
-- Name: schedules Users can update schedules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update schedules" ON public.schedules FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM (public.pharmacists p
     JOIN public.user_roles ur ON ((p.pharmacy_id = ur.pharmacy_id)))
  WHERE ((p.id = schedules.pharmacist_id) AND (ur.user_id = auth.uid()) AND ((ur.role)::text = ANY (ARRAY[('pharmacy_admin'::character varying)::text, ('manager'::character varying)::text]))))) OR (EXISTS ( SELECT 1
   FROM public.pharmacists p
  WHERE ((p.id = schedules.pharmacist_id) AND (p.user_id = auth.uid())))))) WITH CHECK ((pharmacy_id = ( SELECT pharmacists.pharmacy_id
   FROM public.pharmacists
  WHERE (pharmacists.id = schedules.pharmacist_id))));


--
-- Name: user_roles Users can update their own role; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own role" ON public.user_roles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: schedule_change_history Users can view schedule change history for their pharmacy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view schedule change history for their pharmacy" ON public.schedule_change_history FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ((public.schedules s
     JOIN public.pharmacists p ON ((s.pharmacist_id = p.id)))
     JOIN public.user_roles ur ON ((p.pharmacy_id = ur.pharmacy_id)))
  WHERE ((s.id = schedule_change_history.schedule_id) AND (ur.user_id = auth.uid())))));


--
-- Name: user_roles Users can view their own role; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: certifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;

--
-- Name: pharmacies; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;

--
-- Name: pharmacies pharmacies_all_service; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pharmacies_all_service ON public.pharmacies TO service_role USING (true) WITH CHECK (true);


--
-- Name: pharmacies pharmacies_delete_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pharmacies_delete_admin ON public.pharmacies FOR DELETE TO authenticated USING ((id IN ( SELECT user_roles.pharmacy_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = 'admin'::text)))));


--
-- Name: pharmacies pharmacies_insert_auth; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pharmacies_insert_auth ON public.pharmacies FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));


--
-- Name: pharmacies pharmacies_select_auth; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pharmacies_select_auth ON public.pharmacies FOR SELECT TO authenticated USING ((id IN ( SELECT user_roles.pharmacy_id
   FROM public.user_roles
  WHERE (user_roles.user_id = auth.uid()))));


--
-- Name: pharmacies pharmacies_update_admin_mgr; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pharmacies_update_admin_mgr ON public.pharmacies FOR UPDATE TO authenticated USING ((id IN ( SELECT user_roles.pharmacy_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = ANY (ARRAY[('admin'::character varying)::text, ('manager'::character varying)::text])))))) WITH CHECK (true);


--
-- Name: pharmacist_availability; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pharmacist_availability ENABLE ROW LEVEL SECURITY;

--
-- Name: pharmacist_specialties; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pharmacist_specialties ENABLE ROW LEVEL SECURITY;

--
-- Name: pharmacists; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pharmacists ENABLE ROW LEVEL SECURITY;

--
-- Name: pharmacists pharmacists_all_service; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pharmacists_all_service ON public.pharmacists TO service_role USING (true) WITH CHECK (true);


--
-- Name: pharmacists pharmacists_delete_admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pharmacists_delete_admin ON public.pharmacists FOR DELETE TO authenticated USING ((pharmacy_id IN ( SELECT user_roles.pharmacy_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = 'admin'::text)))));


--
-- Name: pharmacists pharmacists_insert_auth; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pharmacists_insert_auth ON public.pharmacists FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) OR (pharmacy_id IN ( SELECT user_roles.pharmacy_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = ANY (ARRAY[('admin'::character varying)::text, ('manager'::character varying)::text])))))));


--
-- Name: pharmacists pharmacists_select_auth; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pharmacists_select_auth ON public.pharmacists FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR (pharmacy_id IN ( SELECT user_roles.pharmacy_id
   FROM public.user_roles
  WHERE (user_roles.user_id = auth.uid())))));


--
-- Name: pharmacists pharmacists_update_auth; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY pharmacists_update_auth ON public.pharmacists FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR (pharmacy_id IN ( SELECT user_roles.pharmacy_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = ANY (ARRAY[('admin'::character varying)::text, ('manager'::character varying)::text]))))))) WITH CHECK (true);


--
-- Name: schedule_change_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.schedule_change_history ENABLE ROW LEVEL SECURITY;

--
-- Name: schedules; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

--
-- Name: schedules schedules_all_service; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY schedules_all_service ON public.schedules TO service_role USING (true) WITH CHECK (true);


--
-- Name: schedules schedules_delete_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY schedules_delete_policy ON public.schedules FOR DELETE TO authenticated USING ((pharmacy_id IN ( SELECT user_roles.pharmacy_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = 'admin'::text)))));


--
-- Name: schedules schedules_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY schedules_insert_policy ON public.schedules FOR INSERT TO authenticated WITH CHECK (((pharmacist_id IN ( SELECT pharmacists.id
   FROM public.pharmacists
  WHERE (pharmacists.user_id = auth.uid()))) OR ((pharmacy_id IS NOT NULL) AND (pharmacy_id IN ( SELECT user_roles.pharmacy_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = ANY (ARRAY[('admin'::character varying)::text, ('manager'::character varying)::text]))))))));


--
-- Name: schedules schedules_select_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY schedules_select_policy ON public.schedules FOR SELECT TO authenticated USING (((created_by = auth.uid()) OR (pharmacist_id IN ( SELECT pharmacists.id
   FROM public.pharmacists
  WHERE (pharmacists.user_id = auth.uid()))) OR (pharmacy_id IN ( SELECT user_roles.pharmacy_id
   FROM public.user_roles
  WHERE (user_roles.user_id = auth.uid())))));


--
-- Name: schedules schedules_update_policy; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY schedules_update_policy ON public.schedules FOR UPDATE TO authenticated USING (((created_by = auth.uid()) OR (pharmacy_id IN ( SELECT user_roles.pharmacy_id
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND ((user_roles.role)::text = ANY (ARRAY[('admin'::character varying)::text, ('manager'::character varying)::text]))))))) WITH CHECK (true);


--
-- Name: shift_requests; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.shift_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: specialties; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: work_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.work_records ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


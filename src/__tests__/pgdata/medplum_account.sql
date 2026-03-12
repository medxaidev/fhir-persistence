--
-- PostgreSQL database dump
--

\restrict MUqRtXU2wAVzhtIFkaiHxl7eFakfgUXju1SZpmX6yZ5RDtdVlwEndZ02f3egoyU

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2026-02-24 04:36:34

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 180246)
-- Name: Account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Account" (
    id uuid NOT NULL,
    content text NOT NULL,
    "lastUpdated" timestamp with time zone NOT NULL,
    compartments uuid[] NOT NULL,
    name text,
    owner text,
    patient text[],
    period timestamp with time zone,
    status text,
    subject text[],
    deleted boolean DEFAULT false NOT NULL,
    _profile text[],
    _source text,
    "projectId" uuid NOT NULL,
    __version integer NOT NULL,
    "___securitySort" text,
    "___tagSort" text,
    "__identifierSort" text,
    "__typeSort" text,
    "___compartmentIdentifierSort" text,
    "__ownerIdentifierSort" text,
    "__patientIdentifierSort" text,
    "__subjectIdentifierSort" text,
    "__sharedTokens" uuid[],
    "__sharedTokensText" text[],
    ___tag uuid[],
    "___tagText" text[],
    __identifier uuid[],
    "__identifierText" text[],
    __type uuid[],
    "__typeText" text[]
);


ALTER TABLE public."Account" OWNER TO postgres;

--
-- TOC entry 6446 (class 2606 OID 180252)
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- TOC entry 6428 (class 1259 OID 199491)
-- Name: Account____tagTextTrgm_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account____tagTextTrgm_idx" ON public."Account" USING gin (public.token_array_to_text("___tagText") public.gin_trgm_ops);


--
-- TOC entry 6429 (class 1259 OID 199484)
-- Name: Account____tag_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account____tag_idx" ON public."Account" USING gin (___tag);


--
-- TOC entry 6430 (class 1259 OID 199501)
-- Name: Account___idntTextTrgm_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account___idntTextTrgm_idx" ON public."Account" USING gin (public.token_array_to_text("__identifierText") public.gin_trgm_ops);


--
-- TOC entry 6431 (class 1259 OID 199495)
-- Name: Account___idnt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account___idnt_idx" ON public."Account" USING gin (__identifier);


--
-- TOC entry 6432 (class 1259 OID 199478)
-- Name: Account___sharedTokensTextTrgm_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account___sharedTokensTextTrgm_idx" ON public."Account" USING gin (public.token_array_to_text("__sharedTokensText") public.gin_trgm_ops);


--
-- TOC entry 6433 (class 1259 OID 199470)
-- Name: Account___sharedTokens_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account___sharedTokens_idx" ON public."Account" USING gin ("__sharedTokens");


--
-- TOC entry 6434 (class 1259 OID 199512)
-- Name: Account___typeTextTrgm_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account___typeTextTrgm_idx" ON public."Account" USING gin (public.token_array_to_text("__typeText") public.gin_trgm_ops);


--
-- TOC entry 6435 (class 1259 OID 199508)
-- Name: Account___type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account___type_idx" ON public."Account" USING gin (__type);


--
-- TOC entry 6436 (class 1259 OID 198331)
-- Name: Account___version_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account___version_idx" ON public."Account" USING btree (__version);


--
-- TOC entry 6437 (class 1259 OID 190110)
-- Name: Account__profile_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account__profile_idx" ON public."Account" USING gin (_profile);


--
-- TOC entry 6438 (class 1259 OID 190112)
-- Name: Account__source_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account__source_idx" ON public."Account" USING btree (_source);


--
-- TOC entry 6439 (class 1259 OID 186105)
-- Name: Account_compartments_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_compartments_idx" ON public."Account" USING gin (compartments);


--
-- TOC entry 6440 (class 1259 OID 186104)
-- Name: Account_lastUpdated_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_lastUpdated_idx" ON public."Account" USING btree ("lastUpdated");


--
-- TOC entry 6441 (class 1259 OID 191355)
-- Name: Account_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_name_idx" ON public."Account" USING btree (name);


--
-- TOC entry 6442 (class 1259 OID 191356)
-- Name: Account_owner_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_owner_idx" ON public."Account" USING btree (owner);


--
-- TOC entry 6443 (class 1259 OID 191357)
-- Name: Account_patient_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_patient_idx" ON public."Account" USING gin (patient);


--
-- TOC entry 6444 (class 1259 OID 191358)
-- Name: Account_period_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_period_idx" ON public."Account" USING btree (period);


--
-- TOC entry 6447 (class 1259 OID 192575)
-- Name: Account_projectId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_projectId_idx" ON public."Account" USING btree ("projectId");


--
-- TOC entry 6448 (class 1259 OID 205865)
-- Name: Account_projectId_lastUpdated_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_projectId_lastUpdated_idx" ON public."Account" USING btree ("projectId", "lastUpdated");


--
-- TOC entry 6449 (class 1259 OID 207094)
-- Name: Account_reindex_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_reindex_idx" ON public."Account" USING btree ("lastUpdated", __version) WHERE (deleted = false);


--
-- TOC entry 6450 (class 1259 OID 191359)
-- Name: Account_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_status_idx" ON public."Account" USING btree (status);


--
-- TOC entry 6451 (class 1259 OID 191360)
-- Name: Account_subject_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_subject_idx" ON public."Account" USING gin (subject);


-- Completed on 2026-02-24 04:36:34

--
-- PostgreSQL database dump complete
--

\unrestrict MUqRtXU2wAVzhtIFkaiHxl7eFakfgUXju1SZpmX6yZ5RDtdVlwEndZ02f3egoyU


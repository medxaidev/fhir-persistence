--
-- PostgreSQL database dump
--

\restrict i67vJCKSNgYu9mNBTl8ZtWHm9g7tJeNCRbYS6t8RfYWkP4WOD11WX2vJvUFBVFp

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2026-02-24 04:38:52

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
-- TOC entry 218 (class 1259 OID 198523)
-- Name: Account_History; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Account_History" (
    "versionId" uuid NOT NULL,
    id uuid NOT NULL,
    content text NOT NULL,
    "lastUpdated" timestamp with time zone NOT NULL
);


ALTER TABLE public."Account_History" OWNER TO postgres;

--
-- TOC entry 6054 (class 2606 OID 198529)
-- Name: Account_History Account_History_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account_History"
    ADD CONSTRAINT "Account_History_pk" PRIMARY KEY ("versionId");


--
-- TOC entry 6051 (class 1259 OID 202239)
-- Name: Account_History_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_History_id_idx" ON public."Account_History" USING btree (id);


--
-- TOC entry 6052 (class 1259 OID 202241)
-- Name: Account_History_lastUpdated_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_History_lastUpdated_idx" ON public."Account_History" USING btree ("lastUpdated");


-- Completed on 2026-02-24 04:38:52

--
-- PostgreSQL database dump complete
--

\unrestrict i67vJCKSNgYu9mNBTl8ZtWHm9g7tJeNCRbYS6t8RfYWkP4WOD11WX2vJvUFBVFp


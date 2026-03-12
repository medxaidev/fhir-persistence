--
-- PostgreSQL database dump
--

\restrict QyjPHejzkxL95Zala32pUk4OtpYDhqcVKjCIUB7CNNrNT6Mb5BVQILFxfXrFmRR

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

-- Started on 2026-02-24 04:39:11

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
-- TOC entry 219 (class 1259 OID 198530)
-- Name: Account_References; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Account_References" (
    "resourceId" uuid NOT NULL,
    "targetId" uuid NOT NULL,
    code text NOT NULL
);


ALTER TABLE public."Account_References" OWNER TO postgres;

--
-- TOC entry 6052 (class 2606 OID 198536)
-- Name: Account_References Account_References_pk; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account_References"
    ADD CONSTRAINT "Account_References_pk" PRIMARY KEY ("resourceId", "targetId", code);


--
-- TOC entry 6053 (class 1259 OID 202242)
-- Name: Account_References_targetId_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Account_References_targetId_code_idx" ON public."Account_References" USING btree ("targetId", code) INCLUDE ("resourceId");


-- Completed on 2026-02-24 04:39:11

--
-- PostgreSQL database dump complete
--

\unrestrict QyjPHejzkxL95Zala32pUk4OtpYDhqcVKjCIUB7CNNrNT6Mb5BVQILFxfXrFmRR


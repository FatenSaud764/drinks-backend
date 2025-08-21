--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Debian 14.18-1.pgdg120+1)
-- Dumped by pg_dump version 16.9 (Ubuntu 16.9-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_user_id_c564eba6_fk_auth_user_id;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_content_type_id_c4bce8eb_fk_django_co;
ALTER TABLE IF EXISTS ONLY public.barbackend_orderitem DROP CONSTRAINT IF EXISTS barbackend_orderitem_order_id_f9735e29_fk_barbackend_order_id;
ALTER TABLE IF EXISTS ONLY public.barbackend_orderitem DROP CONSTRAINT IF EXISTS barbackend_orderitem_drink_id_3130a7e7_fk_barbackend_drink_id;
ALTER TABLE IF EXISTS ONLY public.barbackend_order DROP CONSTRAINT IF EXISTS barbackend_order_user_id_4bc7d8b6_fk_barbackend_user_id;
ALTER TABLE IF EXISTS ONLY public.barbackend_cartitem DROP CONSTRAINT IF EXISTS barbackend_cartitem_drink_id_45acf3f2_fk_barbackend_drink_id;
ALTER TABLE IF EXISTS ONLY public.barbackend_cartitem DROP CONSTRAINT IF EXISTS barbackend_cartitem_cart_id_1981aa35_fk_barbackend_cart_id;
ALTER TABLE IF EXISTS ONLY public.barbackend_cart DROP CONSTRAINT IF EXISTS barbackend_cart_user_id_ad62b38c_fk_barbackend_user_id;
ALTER TABLE IF EXISTS ONLY public.auth_user_user_permissions DROP CONSTRAINT IF EXISTS auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id;
ALTER TABLE IF EXISTS ONLY public.auth_user_user_permissions DROP CONSTRAINT IF EXISTS auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm;
ALTER TABLE IF EXISTS ONLY public.auth_user_groups DROP CONSTRAINT IF EXISTS auth_user_groups_user_id_6a12ed8b_fk_auth_user_id;
ALTER TABLE IF EXISTS ONLY public.auth_user_groups DROP CONSTRAINT IF EXISTS auth_user_groups_group_id_97559544_fk_auth_group_id;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_content_type_id_2f476e4b_fk_django_co;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_group_id_b120cbf9_fk_auth_group_id;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissio_permission_id_84c5c92e_fk_auth_perm;
DROP INDEX IF EXISTS public.django_session_session_key_c0390e0f_like;
DROP INDEX IF EXISTS public.django_session_expire_date_a5c62663;
DROP INDEX IF EXISTS public.django_admin_log_user_id_c564eba6;
DROP INDEX IF EXISTS public.django_admin_log_content_type_id_c4bce8eb;
DROP INDEX IF EXISTS public.barbackend_user_username_33deff3a_like;
DROP INDEX IF EXISTS public.barbackend_user_email_759a19ed_like;
DROP INDEX IF EXISTS public.barbackend_orderitem_order_id_f9735e29;
DROP INDEX IF EXISTS public.barbackend_orderitem_drink_id_3130a7e7;
DROP INDEX IF EXISTS public.barbackend_order_user_id_4bc7d8b6;
DROP INDEX IF EXISTS public.barbackend_cartitem_drink_id_45acf3f2;
DROP INDEX IF EXISTS public.barbackend_cartitem_cart_id_1981aa35;
DROP INDEX IF EXISTS public.auth_user_username_6821ab7c_like;
DROP INDEX IF EXISTS public.auth_user_user_permissions_user_id_a95ead1b;
DROP INDEX IF EXISTS public.auth_user_user_permissions_permission_id_1fbb5f2c;
DROP INDEX IF EXISTS public.auth_user_groups_user_id_6a12ed8b;
DROP INDEX IF EXISTS public.auth_user_groups_group_id_97559544;
DROP INDEX IF EXISTS public.auth_permission_content_type_id_2f476e4b;
DROP INDEX IF EXISTS public.auth_group_permissions_permission_id_84c5c92e;
DROP INDEX IF EXISTS public.auth_group_permissions_group_id_b120cbf9;
DROP INDEX IF EXISTS public.auth_group_name_a6ea08ec_like;
ALTER TABLE IF EXISTS ONLY public.django_session DROP CONSTRAINT IF EXISTS django_session_pkey;
ALTER TABLE IF EXISTS ONLY public.django_migrations DROP CONSTRAINT IF EXISTS django_migrations_pkey;
ALTER TABLE IF EXISTS ONLY public.django_content_type DROP CONSTRAINT IF EXISTS django_content_type_pkey;
ALTER TABLE IF EXISTS ONLY public.django_content_type DROP CONSTRAINT IF EXISTS django_content_type_app_label_model_76bd3d3b_uniq;
ALTER TABLE IF EXISTS ONLY public.django_admin_log DROP CONSTRAINT IF EXISTS django_admin_log_pkey;
ALTER TABLE IF EXISTS ONLY public.barbackend_user DROP CONSTRAINT IF EXISTS barbackend_user_username_key;
ALTER TABLE IF EXISTS ONLY public.barbackend_user DROP CONSTRAINT IF EXISTS barbackend_user_pkey;
ALTER TABLE IF EXISTS ONLY public.barbackend_user DROP CONSTRAINT IF EXISTS barbackend_user_email_key;
ALTER TABLE IF EXISTS ONLY public.barbackend_orderitem DROP CONSTRAINT IF EXISTS barbackend_orderitem_pkey;
ALTER TABLE IF EXISTS ONLY public.barbackend_order DROP CONSTRAINT IF EXISTS barbackend_order_pkey;
ALTER TABLE IF EXISTS ONLY public.barbackend_drink DROP CONSTRAINT IF EXISTS barbackend_drink_pkey;
ALTER TABLE IF EXISTS ONLY public.barbackend_cartitem DROP CONSTRAINT IF EXISTS barbackend_cartitem_pkey;
ALTER TABLE IF EXISTS ONLY public.barbackend_cartitem DROP CONSTRAINT IF EXISTS barbackend_cartitem_cart_id_drink_id_5b25342a_uniq;
ALTER TABLE IF EXISTS ONLY public.barbackend_cart DROP CONSTRAINT IF EXISTS barbackend_cart_user_id_key;
ALTER TABLE IF EXISTS ONLY public.barbackend_cart DROP CONSTRAINT IF EXISTS barbackend_cart_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_user DROP CONSTRAINT IF EXISTS auth_user_username_key;
ALTER TABLE IF EXISTS ONLY public.auth_user_user_permissions DROP CONSTRAINT IF EXISTS auth_user_user_permissions_user_id_permission_id_14a6b632_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_user_user_permissions DROP CONSTRAINT IF EXISTS auth_user_user_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_user DROP CONSTRAINT IF EXISTS auth_user_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_user_groups DROP CONSTRAINT IF EXISTS auth_user_groups_user_id_group_id_94350c0c_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_user_groups DROP CONSTRAINT IF EXISTS auth_user_groups_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_permission DROP CONSTRAINT IF EXISTS auth_permission_content_type_id_codename_01ab375a_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_group DROP CONSTRAINT IF EXISTS auth_group_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.auth_group_permissions DROP CONSTRAINT IF EXISTS auth_group_permissions_group_id_permission_id_0cd325b0_uniq;
ALTER TABLE IF EXISTS ONLY public.auth_group DROP CONSTRAINT IF EXISTS auth_group_name_key;
DROP TABLE IF EXISTS public.django_session;
DROP TABLE IF EXISTS public.django_migrations;
DROP TABLE IF EXISTS public.django_content_type;
DROP TABLE IF EXISTS public.django_admin_log;
DROP TABLE IF EXISTS public.barbackend_user;
DROP TABLE IF EXISTS public.barbackend_orderitem;
DROP TABLE IF EXISTS public.barbackend_order;
DROP TABLE IF EXISTS public.barbackend_drink;
DROP TABLE IF EXISTS public.barbackend_cartitem;
DROP TABLE IF EXISTS public.barbackend_cart;
DROP TABLE IF EXISTS public.auth_user_user_permissions;
DROP TABLE IF EXISTS public.auth_user_groups;
DROP TABLE IF EXISTS public.auth_user;
DROP TABLE IF EXISTS public.auth_permission;
DROP TABLE IF EXISTS public.auth_group_permissions;
DROP TABLE IF EXISTS public.auth_group;
-- *not* dropping schema, since initdb creates it
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: baruser
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO baruser;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auth_group; Type: TABLE; Schema: public; Owner: baruser
--

CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE public.auth_group OWNER TO baruser;

--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: baruser
--

ALTER TABLE public.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: baruser
--

CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_group_permissions OWNER TO baruser;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: baruser
--

ALTER TABLE public.auth_group_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: baruser
--

CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


ALTER TABLE public.auth_permission OWNER TO baruser;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: baruser
--

ALTER TABLE public.auth_permission ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user; Type: TABLE; Schema: public; Owner: baruser
--

CREATE TABLE public.auth_user (
    id integer NOT NULL,
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    username character varying(150) NOT NULL,
    first_name character varying(150) NOT NULL,
    last_name character varying(150) NOT NULL,
    email character varying(254) NOT NULL,
    is_staff boolean NOT NULL,
    is_active boolean NOT NULL,
    date_joined timestamp with time zone NOT NULL
);


ALTER TABLE public.auth_user OWNER TO baruser;

--
-- Name: auth_user_groups; Type: TABLE; Schema: public; Owner: baruser
--

CREATE TABLE public.auth_user_groups (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.auth_user_groups OWNER TO baruser;

--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: baruser
--

ALTER TABLE public.auth_user_groups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_id_seq; Type: SEQUENCE; Schema: public; Owner: baruser
--

ALTER TABLE public.auth_user ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_user_permissions; Type: TABLE; Schema: public; Owner: baruser
--

CREATE TABLE public.auth_user_user_permissions (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_user_user_permissions OWNER TO baruser;

--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: baruser
--

ALTER TABLE public.auth_user_user_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: barbackend_cart; Type: TABLE; Schema: public; Owner: baruser
--

CREATE TABLE public.barbackend_cart (
    id bigint NOT NULL,
    created_at timestamp with time zone NOT NULL,
    user_id bigint NOT NULL,
    note text NOT NULL
);


ALTER TABLE public.barbackend_cart OWNER TO baruser;

--
-- Name: barbackend_cart_id_seq; Type: SEQUENCE; Schema: public; Owner: baruser
--

ALTER TABLE public.barbackend_cart ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.barbackend_cart_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: barbackend_cartitem; Type: TABLE; Schema: public; Owner: baruser
--

CREATE TABLE public.barbackend_cartitem (
    id bigint NOT NULL,
    quantity integer NOT NULL,
    added_at timestamp with time zone NOT NULL,
    cart_id bigint NOT NULL,
    drink_id bigint NOT NULL,
    CONSTRAINT barbackend_cartitem_quantity_check CHECK ((quantity >= 0))
);


ALTER TABLE public.barbackend_cartitem OWNER TO baruser;

--
-- Name: barbackend_cartitem_id_seq; Type: SEQUENCE; Schema: public; Owner: baruser
--

ALTER TABLE public.barbackend_cartitem ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.barbackend_cartitem_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: barbackend_drink; Type: TABLE; Schema: public; Owner: baruser
--

CREATE TABLE public.barbackend_drink (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    description text NOT NULL,
    price numeric(6,2) NOT NULL,
    available boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    image character varying(100) NOT NULL,
    stock integer NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    category character varying(50) NOT NULL,
    CONSTRAINT barbackend_drink_stock_check CHECK ((stock >= 0))
);


ALTER TABLE public.barbackend_drink OWNER TO baruser;

--
-- Name: barbackend_drink_id_seq; Type: SEQUENCE; Schema: public; Owner: baruser
--

ALTER TABLE public.barbackend_drink ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.barbackend_drink_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: barbackend_order; Type: TABLE; Schema: public; Owner: baruser
--

CREATE TABLE public.barbackend_order (
    id bigint NOT NULL,
    status character varying(30) NOT NULL,
    total_price numeric(8,2) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    user_id bigint NOT NULL,
    note text NOT NULL
);


ALTER TABLE public.barbackend_order OWNER TO baruser;

--
-- Name: barbackend_order_id_seq; Type: SEQUENCE; Schema: public; Owner: baruser
--

ALTER TABLE public.barbackend_order ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.barbackend_order_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: barbackend_orderitem; Type: TABLE; Schema: public; Owner: baruser
--

CREATE TABLE public.barbackend_orderitem (
    id bigint NOT NULL,
    quantity integer NOT NULL,
    drink_id bigint NOT NULL,
    order_id bigint NOT NULL,
    CONSTRAINT barbackend_orderitem_quantity_check CHECK ((quantity >= 0))
);


ALTER TABLE public.barbackend_orderitem OWNER TO baruser;

--
-- Name: barbackend_orderitem_id_seq; Type: SEQUENCE; Schema: public; Owner: baruser
--

ALTER TABLE public.barbackend_orderitem ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.barbackend_orderitem_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: barbackend_user; Type: TABLE; Schema: public; Owner: baruser
--

CREATE TABLE public.barbackend_user (
    id bigint NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(254) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.barbackend_user OWNER TO baruser;

--
-- Name: barbackend_user_id_seq; Type: SEQUENCE; Schema: public; Owner: baruser
--

ALTER TABLE public.barbackend_user ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.barbackend_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_admin_log; Type: TABLE; Schema: public; Owner: baruser
--

CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id integer NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);


ALTER TABLE public.django_admin_log OWNER TO baruser;

--
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: baruser
--

ALTER TABLE public.django_admin_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_admin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: baruser
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE public.django_content_type OWNER TO baruser;

--
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: baruser
--

ALTER TABLE public.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: baruser
--

CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE public.django_migrations OWNER TO baruser;

--
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: baruser
--

ALTER TABLE public.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_session; Type: TABLE; Schema: public; Owner: baruser
--

CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


ALTER TABLE public.django_session OWNER TO baruser;

--
-- Data for Name: auth_group; Type: TABLE DATA; Schema: public; Owner: baruser
--



--
-- Data for Name: auth_group_permissions; Type: TABLE DATA; Schema: public; Owner: baruser
--



--
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: baruser
--

INSERT INTO public.auth_permission VALUES (1, 'Can add log entry', 1, 'add_logentry');
INSERT INTO public.auth_permission VALUES (2, 'Can change log entry', 1, 'change_logentry');
INSERT INTO public.auth_permission VALUES (3, 'Can delete log entry', 1, 'delete_logentry');
INSERT INTO public.auth_permission VALUES (4, 'Can view log entry', 1, 'view_logentry');
INSERT INTO public.auth_permission VALUES (5, 'Can add permission', 2, 'add_permission');
INSERT INTO public.auth_permission VALUES (6, 'Can change permission', 2, 'change_permission');
INSERT INTO public.auth_permission VALUES (7, 'Can delete permission', 2, 'delete_permission');
INSERT INTO public.auth_permission VALUES (8, 'Can view permission', 2, 'view_permission');
INSERT INTO public.auth_permission VALUES (9, 'Can add group', 3, 'add_group');
INSERT INTO public.auth_permission VALUES (10, 'Can change group', 3, 'change_group');
INSERT INTO public.auth_permission VALUES (11, 'Can delete group', 3, 'delete_group');
INSERT INTO public.auth_permission VALUES (12, 'Can view group', 3, 'view_group');
INSERT INTO public.auth_permission VALUES (13, 'Can add user', 4, 'add_user');
INSERT INTO public.auth_permission VALUES (14, 'Can change user', 4, 'change_user');
INSERT INTO public.auth_permission VALUES (15, 'Can delete user', 4, 'delete_user');
INSERT INTO public.auth_permission VALUES (16, 'Can view user', 4, 'view_user');
INSERT INTO public.auth_permission VALUES (17, 'Can add content type', 5, 'add_contenttype');
INSERT INTO public.auth_permission VALUES (18, 'Can change content type', 5, 'change_contenttype');
INSERT INTO public.auth_permission VALUES (19, 'Can delete content type', 5, 'delete_contenttype');
INSERT INTO public.auth_permission VALUES (20, 'Can view content type', 5, 'view_contenttype');
INSERT INTO public.auth_permission VALUES (21, 'Can add session', 6, 'add_session');
INSERT INTO public.auth_permission VALUES (22, 'Can change session', 6, 'change_session');
INSERT INTO public.auth_permission VALUES (23, 'Can delete session', 6, 'delete_session');
INSERT INTO public.auth_permission VALUES (24, 'Can view session', 6, 'view_session');
INSERT INTO public.auth_permission VALUES (25, 'Can add drink', 7, 'add_drink');
INSERT INTO public.auth_permission VALUES (26, 'Can change drink', 7, 'change_drink');
INSERT INTO public.auth_permission VALUES (27, 'Can delete drink', 7, 'delete_drink');
INSERT INTO public.auth_permission VALUES (28, 'Can view drink', 7, 'view_drink');
INSERT INTO public.auth_permission VALUES (29, 'Can add order', 8, 'add_order');
INSERT INTO public.auth_permission VALUES (30, 'Can change order', 8, 'change_order');
INSERT INTO public.auth_permission VALUES (31, 'Can delete order', 8, 'delete_order');
INSERT INTO public.auth_permission VALUES (32, 'Can view order', 8, 'view_order');
INSERT INTO public.auth_permission VALUES (33, 'Can add user', 9, 'add_user');
INSERT INTO public.auth_permission VALUES (34, 'Can change user', 9, 'change_user');
INSERT INTO public.auth_permission VALUES (35, 'Can delete user', 9, 'delete_user');
INSERT INTO public.auth_permission VALUES (36, 'Can view user', 9, 'view_user');
INSERT INTO public.auth_permission VALUES (37, 'Can add order item', 10, 'add_orderitem');
INSERT INTO public.auth_permission VALUES (38, 'Can change order item', 10, 'change_orderitem');
INSERT INTO public.auth_permission VALUES (39, 'Can delete order item', 10, 'delete_orderitem');
INSERT INTO public.auth_permission VALUES (40, 'Can view order item', 10, 'view_orderitem');
INSERT INTO public.auth_permission VALUES (41, 'Can add cart', 11, 'add_cart');
INSERT INTO public.auth_permission VALUES (42, 'Can change cart', 11, 'change_cart');
INSERT INTO public.auth_permission VALUES (43, 'Can delete cart', 11, 'delete_cart');
INSERT INTO public.auth_permission VALUES (44, 'Can view cart', 11, 'view_cart');
INSERT INTO public.auth_permission VALUES (45, 'Can add cart item', 12, 'add_cartitem');
INSERT INTO public.auth_permission VALUES (46, 'Can change cart item', 12, 'change_cartitem');
INSERT INTO public.auth_permission VALUES (47, 'Can delete cart item', 12, 'delete_cartitem');
INSERT INTO public.auth_permission VALUES (48, 'Can view cart item', 12, 'view_cartitem');


--
-- Data for Name: auth_user; Type: TABLE DATA; Schema: public; Owner: baruser
--



--
-- Data for Name: auth_user_groups; Type: TABLE DATA; Schema: public; Owner: baruser
--



--
-- Data for Name: auth_user_user_permissions; Type: TABLE DATA; Schema: public; Owner: baruser
--



--
-- Data for Name: barbackend_cart; Type: TABLE DATA; Schema: public; Owner: baruser
--



--
-- Data for Name: barbackend_cartitem; Type: TABLE DATA; Schema: public; Owner: baruser
--



--
-- Data for Name: barbackend_drink; Type: TABLE DATA; Schema: public; Owner: baruser
--

INSERT INTO public.barbackend_drink VALUES (1, 'Espresso Martini', '', 80.00, true, '2025-08-20 16:18:56.409879+00', 'assets/cocktail.png', 10, '2025-08-20 16:18:56.409904+00', 'Alcoholic');
INSERT INTO public.barbackend_drink VALUES (2, 'Irish Ale', '', 50.00, true, '2025-08-20 16:21:51.568935+00', 'assets/irishale.png', 10, '2025-08-20 16:21:51.568951+00', 'Alcoholic');
INSERT INTO public.barbackend_drink VALUES (3, 'Tequila', '', 50.00, true, '2025-08-20 16:23:48.03699+00', 'assets/tequila.png', 10, '2025-08-20 16:23:48.037003+00', 'Alcoholic');


--
-- Data for Name: barbackend_order; Type: TABLE DATA; Schema: public; Owner: baruser
--

INSERT INTO public.barbackend_order VALUES (1, 'pending', 100.00, '2025-08-18 18:33:04.089128+00', '2025-08-18 18:33:04.089128+00', 1, '');
INSERT INTO public.barbackend_order VALUES (2, 'preparing', 80.00, '2025-08-19 18:51:03.363423+00', '2025-08-19 18:51:03.363423+00', 1, '');
INSERT INTO public.barbackend_order VALUES (3, 'cancelled', 45.00, '2025-08-19 18:51:27.053493+00', '2025-08-19 18:51:27.053493+00', 1, '');
INSERT INTO public.barbackend_order VALUES (4, 'ready', 95.00, '2025-08-19 18:51:42.400456+00', '2025-08-19 18:51:42.400456+00', 1, '');
INSERT INTO public.barbackend_order VALUES (5, 'ready', 35.00, '2025-08-19 18:51:51.379722+00', '2025-08-19 18:51:51.379722+00', 1, '');
INSERT INTO public.barbackend_order VALUES (6, 'completed', 75.00, '2025-08-19 18:52:04.666904+00', '2025-08-19 18:52:04.666904+00', 1, '');
INSERT INTO public.barbackend_order VALUES (7, 'completed', 100.00, '2025-08-19 18:52:26.976006+00', '2025-08-19 18:52:26.976006+00', 1, '');


--
-- Data for Name: barbackend_orderitem; Type: TABLE DATA; Schema: public; Owner: baruser
--



--
-- Data for Name: barbackend_user; Type: TABLE DATA; Schema: public; Owner: baruser
--

INSERT INTO public.barbackend_user VALUES (1, 'Samus', 'Samus@foo.co.za', '', '', '2025-08-18 18:32:51.911612+00');


--
-- Data for Name: django_admin_log; Type: TABLE DATA; Schema: public; Owner: baruser
--



--
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: baruser
--

INSERT INTO public.django_content_type VALUES (1, 'admin', 'logentry');
INSERT INTO public.django_content_type VALUES (2, 'auth', 'permission');
INSERT INTO public.django_content_type VALUES (3, 'auth', 'group');
INSERT INTO public.django_content_type VALUES (4, 'auth', 'user');
INSERT INTO public.django_content_type VALUES (5, 'contenttypes', 'contenttype');
INSERT INTO public.django_content_type VALUES (6, 'sessions', 'session');
INSERT INTO public.django_content_type VALUES (7, 'barbackend', 'drink');
INSERT INTO public.django_content_type VALUES (8, 'barbackend', 'order');
INSERT INTO public.django_content_type VALUES (9, 'barbackend', 'user');
INSERT INTO public.django_content_type VALUES (10, 'barbackend', 'orderitem');
INSERT INTO public.django_content_type VALUES (11, 'barbackend', 'cart');
INSERT INTO public.django_content_type VALUES (12, 'barbackend', 'cartitem');


--
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: baruser
--

INSERT INTO public.django_migrations VALUES (1, 'contenttypes', '0001_initial', '2025-08-11 15:40:54.88937+00');
INSERT INTO public.django_migrations VALUES (2, 'auth', '0001_initial', '2025-08-11 15:40:55.678309+00');
INSERT INTO public.django_migrations VALUES (3, 'admin', '0001_initial', '2025-08-11 15:40:56.500005+00');
INSERT INTO public.django_migrations VALUES (4, 'admin', '0002_logentry_remove_auto_add', '2025-08-11 15:40:56.518439+00');
INSERT INTO public.django_migrations VALUES (5, 'admin', '0003_logentry_add_action_flag_choices', '2025-08-11 15:40:56.549361+00');
INSERT INTO public.django_migrations VALUES (6, 'contenttypes', '0002_remove_content_type_name', '2025-08-11 15:40:56.568894+00');
INSERT INTO public.django_migrations VALUES (7, 'auth', '0002_alter_permission_name_max_length', '2025-08-11 15:40:56.586827+00');
INSERT INTO public.django_migrations VALUES (8, 'auth', '0003_alter_user_email_max_length', '2025-08-11 15:40:56.60928+00');
INSERT INTO public.django_migrations VALUES (9, 'auth', '0004_alter_user_username_opts', '2025-08-11 15:40:56.629407+00');
INSERT INTO public.django_migrations VALUES (10, 'auth', '0005_alter_user_last_login_null', '2025-08-11 15:40:56.650026+00');
INSERT INTO public.django_migrations VALUES (11, 'auth', '0006_require_contenttypes_0002', '2025-08-11 15:40:56.665927+00');
INSERT INTO public.django_migrations VALUES (12, 'auth', '0007_alter_validators_add_error_messages', '2025-08-11 15:40:56.682749+00');
INSERT INTO public.django_migrations VALUES (13, 'auth', '0008_alter_user_username_max_length', '2025-08-11 15:40:56.746834+00');
INSERT INTO public.django_migrations VALUES (14, 'auth', '0009_alter_user_last_name_max_length', '2025-08-11 15:40:56.764072+00');
INSERT INTO public.django_migrations VALUES (15, 'auth', '0010_alter_group_name_max_length', '2025-08-11 15:40:56.786003+00');
INSERT INTO public.django_migrations VALUES (16, 'auth', '0011_update_proxy_permissions', '2025-08-11 15:40:56.804609+00');
INSERT INTO public.django_migrations VALUES (17, 'auth', '0012_alter_user_first_name_max_length', '2025-08-11 15:40:56.827781+00');
INSERT INTO public.django_migrations VALUES (18, 'barbackend', '0001_initial', '2025-08-11 15:40:58.363915+00');
INSERT INTO public.django_migrations VALUES (19, 'barbackend', '0002_alter_order_status', '2025-08-11 15:40:58.378159+00');
INSERT INTO public.django_migrations VALUES (20, 'sessions', '0001_initial', '2025-08-11 15:40:58.61434+00');
INSERT INTO public.django_migrations VALUES (21, 'barbackend', '0003_drink_image', '2025-08-18 13:25:17.100592+00');
INSERT INTO public.django_migrations VALUES (22, 'barbackend', '0003_cart_note', '2025-08-18 13:56:31.552807+00');
INSERT INTO public.django_migrations VALUES (23, 'barbackend', '0004_order_note', '2025-08-18 13:56:31.596092+00');
INSERT INTO public.django_migrations VALUES (24, 'barbackend', '0005_merge_0003_drink_image_0004_order_note', '2025-08-18 13:56:31.621633+00');
INSERT INTO public.django_migrations VALUES (25, 'barbackend', '0006_remove_cart_note_remove_order_note', '2025-08-18 18:52:07.101557+00');
INSERT INTO public.django_migrations VALUES (26, 'barbackend', '0006_remove_cart_note_remove_order_note_drink_stock_and_more', '2025-08-19 06:22:36.724856+00');
INSERT INTO public.django_migrations VALUES (27, 'barbackend', '0007_drink_category', '2025-08-19 06:22:36.796749+00');
INSERT INTO public.django_migrations VALUES (28, 'barbackend', '0008_alter_drink_image', '2025-08-19 16:10:48.524514+00');
INSERT INTO public.django_migrations VALUES (29, 'barbackend', '0009_alter_drink_image', '2025-08-19 19:15:11.572499+00');
INSERT INTO public.django_migrations VALUES (30, 'barbackend', '0008_cart_note_order_note', '2025-08-20 06:38:06.75994+00');
INSERT INTO public.django_migrations VALUES (31, 'barbackend', '0009_merge_20250819_1942', '2025-08-20 07:22:20.81962+00');
INSERT INTO public.django_migrations VALUES (32, 'barbackend', '0010_alter_drink_image', '2025-08-20 07:22:20.84228+00');


--
-- Data for Name: django_session; Type: TABLE DATA; Schema: public; Owner: baruser
--



--
-- Name: auth_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: baruser
--

SELECT pg_catalog.setval('public.auth_group_id_seq', 1, false);


--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: baruser
--

SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 1, false);


--
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: baruser
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 48, true);


--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: baruser
--

SELECT pg_catalog.setval('public.auth_user_groups_id_seq', 1, false);


--
-- Name: auth_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: baruser
--

SELECT pg_catalog.setval('public.auth_user_id_seq', 1, false);


--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: baruser
--

SELECT pg_catalog.setval('public.auth_user_user_permissions_id_seq', 1, false);


--
-- Name: barbackend_cart_id_seq; Type: SEQUENCE SET; Schema: public; Owner: baruser
--

SELECT pg_catalog.setval('public.barbackend_cart_id_seq', 1, false);


--
-- Name: barbackend_cartitem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: baruser
--

SELECT pg_catalog.setval('public.barbackend_cartitem_id_seq', 1, false);


--
-- Name: barbackend_drink_id_seq; Type: SEQUENCE SET; Schema: public; Owner: baruser
--

SELECT pg_catalog.setval('public.barbackend_drink_id_seq', 3, true);


--
-- Name: barbackend_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: baruser
--

SELECT pg_catalog.setval('public.barbackend_order_id_seq', 2, true);


--
-- Name: barbackend_orderitem_id_seq; Type: SEQUENCE SET; Schema: public; Owner: baruser
--

SELECT pg_catalog.setval('public.barbackend_orderitem_id_seq', 1, false);


--
-- Name: barbackend_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: baruser
--

SELECT pg_catalog.setval('public.barbackend_user_id_seq', 1, false);


--
-- Name: django_admin_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: baruser
--

SELECT pg_catalog.setval('public.django_admin_log_id_seq', 1, false);


--
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: baruser
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 12, true);


--
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: baruser
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 32, true);


--
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_user_id_group_id_94350c0c_uniq; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_group_id_94350c0c_uniq UNIQUE (user_id, group_id);


--
-- Name: auth_user auth_user_pkey; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_permission_id_14a6b632_uniq; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_permission_id_14a6b632_uniq UNIQUE (user_id, permission_id);


--
-- Name: auth_user auth_user_username_key; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_username_key UNIQUE (username);


--
-- Name: barbackend_cart barbackend_cart_pkey; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.barbackend_cart
    ADD CONSTRAINT barbackend_cart_pkey PRIMARY KEY (id);


--
-- Name: barbackend_cart barbackend_cart_user_id_key; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.barbackend_cart
    ADD CONSTRAINT barbackend_cart_user_id_key UNIQUE (user_id);


--
-- Name: barbackend_cartitem barbackend_cartitem_cart_id_drink_id_5b25342a_uniq; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.barbackend_cartitem
    ADD CONSTRAINT barbackend_cartitem_cart_id_drink_id_5b25342a_uniq UNIQUE (cart_id, drink_id);


--
-- Name: barbackend_cartitem barbackend_cartitem_pkey; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.barbackend_cartitem
    ADD CONSTRAINT barbackend_cartitem_pkey PRIMARY KEY (id);


--
-- Name: barbackend_drink barbackend_drink_pkey; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.barbackend_drink
    ADD CONSTRAINT barbackend_drink_pkey PRIMARY KEY (id);


--
-- Name: barbackend_order barbackend_order_pkey; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.barbackend_order
    ADD CONSTRAINT barbackend_order_pkey PRIMARY KEY (id);


--
-- Name: barbackend_orderitem barbackend_orderitem_pkey; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.barbackend_orderitem
    ADD CONSTRAINT barbackend_orderitem_pkey PRIMARY KEY (id);


--
-- Name: barbackend_user barbackend_user_email_key; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.barbackend_user
    ADD CONSTRAINT barbackend_user_email_key UNIQUE (email);


--
-- Name: barbackend_user barbackend_user_pkey; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.barbackend_user
    ADD CONSTRAINT barbackend_user_pkey PRIMARY KEY (id);


--
-- Name: barbackend_user barbackend_user_username_key; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.barbackend_user
    ADD CONSTRAINT barbackend_user_username_key UNIQUE (username);


--
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);


--
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);


--
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);


--
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);


--
-- Name: auth_user_groups_group_id_97559544; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX auth_user_groups_group_id_97559544 ON public.auth_user_groups USING btree (group_id);


--
-- Name: auth_user_groups_user_id_6a12ed8b; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX auth_user_groups_user_id_6a12ed8b ON public.auth_user_groups USING btree (user_id);


--
-- Name: auth_user_user_permissions_permission_id_1fbb5f2c; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX auth_user_user_permissions_permission_id_1fbb5f2c ON public.auth_user_user_permissions USING btree (permission_id);


--
-- Name: auth_user_user_permissions_user_id_a95ead1b; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX auth_user_user_permissions_user_id_a95ead1b ON public.auth_user_user_permissions USING btree (user_id);


--
-- Name: auth_user_username_6821ab7c_like; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX auth_user_username_6821ab7c_like ON public.auth_user USING btree (username varchar_pattern_ops);


--
-- Name: barbackend_cartitem_cart_id_1981aa35; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX barbackend_cartitem_cart_id_1981aa35 ON public.barbackend_cartitem USING btree (cart_id);


--
-- Name: barbackend_cartitem_drink_id_45acf3f2; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX barbackend_cartitem_drink_id_45acf3f2 ON public.barbackend_cartitem USING btree (drink_id);


--
-- Name: barbackend_order_user_id_4bc7d8b6; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX barbackend_order_user_id_4bc7d8b6 ON public.barbackend_order USING btree (user_id);


--
-- Name: barbackend_orderitem_drink_id_3130a7e7; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX barbackend_orderitem_drink_id_3130a7e7 ON public.barbackend_orderitem USING btree (drink_id);


--
-- Name: barbackend_orderitem_order_id_f9735e29; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX barbackend_orderitem_order_id_f9735e29 ON public.barbackend_orderitem USING btree (order_id);


--
-- Name: barbackend_user_email_759a19ed_like; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX barbackend_user_email_759a19ed_like ON public.barbackend_user USING btree (email varchar_pattern_ops);


--
-- Name: barbackend_user_username_33deff3a_like; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX barbackend_user_username_33deff3a_like ON public.barbackend_user USING btree (username varchar_pattern_ops);


--
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);


--
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);


--
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);


--
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: public; Owner: baruser
--

CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);


--
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_group_id_97559544_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_group_id_97559544_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_user_id_6a12ed8b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_6a12ed8b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: barbackend_cart barbackend_cart_user_id_ad62b38c_fk_barbackend_user_id; Type: FK CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.barbackend_cart
    ADD CONSTRAINT barbackend_cart_user_id_ad62b38c_fk_barbackend_user_id FOREIGN KEY (user_id) REFERENCES public.barbackend_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: barbackend_cartitem barbackend_cartitem_cart_id_1981aa35_fk_barbackend_cart_id; Type: FK CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.barbackend_cartitem
    ADD CONSTRAINT barbackend_cartitem_cart_id_1981aa35_fk_barbackend_cart_id FOREIGN KEY (cart_id) REFERENCES public.barbackend_cart(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: barbackend_cartitem barbackend_cartitem_drink_id_45acf3f2_fk_barbackend_drink_id; Type: FK CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.barbackend_cartitem
    ADD CONSTRAINT barbackend_cartitem_drink_id_45acf3f2_fk_barbackend_drink_id FOREIGN KEY (drink_id) REFERENCES public.barbackend_drink(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: barbackend_order barbackend_order_user_id_4bc7d8b6_fk_barbackend_user_id; Type: FK CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.barbackend_order
    ADD CONSTRAINT barbackend_order_user_id_4bc7d8b6_fk_barbackend_user_id FOREIGN KEY (user_id) REFERENCES public.barbackend_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: barbackend_orderitem barbackend_orderitem_drink_id_3130a7e7_fk_barbackend_drink_id; Type: FK CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.barbackend_orderitem
    ADD CONSTRAINT barbackend_orderitem_drink_id_3130a7e7_fk_barbackend_drink_id FOREIGN KEY (drink_id) REFERENCES public.barbackend_drink(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: barbackend_orderitem barbackend_orderitem_order_id_f9735e29_fk_barbackend_order_id; Type: FK CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.barbackend_orderitem
    ADD CONSTRAINT barbackend_orderitem_order_id_f9735e29_fk_barbackend_order_id FOREIGN KEY (order_id) REFERENCES public.barbackend_order(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: baruser
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: baruser
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--


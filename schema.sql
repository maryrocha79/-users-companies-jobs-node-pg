DROP DATABASE IF EXISTS  "users-companies-jobs-db";
CREATE DATABASE "users-companies-jobs-db";
\c "users-companies-jobs-db"
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    logo TEXT,
    handle TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title TEXT,
    salary TEXT,
    equity FLOAT,
    company TEXT REFERENCES companies(handle) ON DELETE CASCADE
);
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    email TEXT,
    photo TEXT,
    current_company TEXT REFERENCES companies (handle) ON DELETE SET NULL
);
CREATE TABLE jobs_users (
    id SERIAL PRIMARY KEY,
    username TEXT REFERENCES users (username) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs (id) ON DELETE CASCADE
);
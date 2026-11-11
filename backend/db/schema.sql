-- Smart Campus Assistance System - PostgreSQL schema
DROP TABLE IF EXISTS notifications, request_status_history, request_assignments, requests, departments, categories, users CASCADE;
DROP SEQUENCE IF EXISTS request_code_seq;

CREATE SEQUENCE request_code_seq START 1001;

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role          VARCHAR(10)  NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin')),
  student_id    VARCHAR(40) UNIQUE,
  phone         VARCHAR(30),
  department    VARCHAR(100),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(80) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE departments (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT
);

CREATE TABLE requests (
  id                   SERIAL PRIMARY KEY,
  request_code         VARCHAR(20) NOT NULL UNIQUE
                       DEFAULT ('REQ-' || to_char(NOW(),'YYYY') || '-' || nextval('request_code_seq')),
  user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id          INTEGER NOT NULL REFERENCES categories(id),
  title                VARCHAR(200) NOT NULL,
  description          TEXT NOT NULL,
  location             VARCHAR(160),
  additional_info      TEXT,
  priority             VARCHAR(10) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low','Medium','High')),
  recommended_priority VARCHAR(10) CHECK (recommended_priority IN ('Low','Medium','High')),
  priority_reason      TEXT,
  status               VARCHAR(20) NOT NULL DEFAULT 'Submitted'
                       CHECK (status IN ('Submitted','Under Review','Assigned','In Progress','Resolved','Rejected')),
  admin_comment        TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE request_assignments (
  id            SERIAL PRIMARY KEY,
  request_id    INTEGER NOT NULL UNIQUE REFERENCES requests(id) ON DELETE CASCADE,
  department_id INTEGER NOT NULL REFERENCES departments(id),
  assigned_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE request_status_history (
  id           SERIAL PRIMARY KEY,
  request_id   INTEGER NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  old_status   VARCHAR(20),
  new_status   VARCHAR(20) NOT NULL,
  old_priority VARCHAR(10),
  new_priority VARCHAR(10),
  comment      TEXT,
  changed_by   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_id INTEGER REFERENCES requests(id) ON DELETE CASCADE,
  message    TEXT NOT NULL,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_requests_user     ON requests(user_id);
CREATE INDEX idx_requests_category ON requests(category_id);
CREATE INDEX idx_requests_status   ON requests(status);
CREATE INDEX idx_requests_priority ON requests(priority);
CREATE INDEX idx_requests_created  ON requests(created_at);
CREATE INDEX idx_history_request   ON request_status_history(request_id);
CREATE INDEX idx_notif_user_read   ON notifications(user_id, is_read);

INSERT INTO categories (name, description) VALUES
 ('IT Support','Network, software, accounts, computer labs'),
 ('Classroom Issues','Projectors, furniture, air conditioning, cleanliness'),
 ('Transportation','University buses, schedules, routes'),
 ('Academic Support','Course information, tutoring, exam queries'),
 ('Maintenance','Electrical, plumbing, building repairs'),
 ('Lost and Found','Lost or found belongings and ID cards'),
 ('Administrative Services','Certificates, fees, registration, documents'),
 ('Other','Anything else');

INSERT INTO departments (name, description) VALUES
 ('IT Department','Handles network, software and hardware problems'),
 ('Academic Department','Handles course and teaching related matters'),
 ('Maintenance Department','Handles repairs and facilities'),
 ('Transportation Department','Handles university transport'),
 ('Administration Department','Handles administrative and general services');

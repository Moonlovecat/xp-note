process.env.NODE_ENV = "test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-with-enough-length-for-local-tests";
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://weenai:weenai@localhost:5432/weenai_test?schema=public";

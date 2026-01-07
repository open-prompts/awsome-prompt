-- Seed Service User
INSERT INTO users (id, email, password_hash, display_name)
VALUES ('service', 'service@awsome-prompt.com', 'seeded_service_account_hash', 'Service Account')
ON CONFLICT (id) DO NOTHING;

-- Template 1: Technical Codebase Discovery
WITH t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, created_at, updated_at)
    VALUES (
        'service', 
        'Technical Codebase Discovery', 
        'Analyze codebase structure and intent', 
        'public', 
        'system', 
        ARRAY['coding', 'analysis'], 
        'coding', 
        NOW(), 
        NOW()
    )
    RETURNING id
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT id, 1, 'Analyze the following codebase and provide a structural overview, identifying key design patterns, potential architectural bottlenecks, and the overall intent of the project. Highlight any unusual or innovative implementation details.', NOW() 
FROM t;

-- Template 2: The Bug Hunter
WITH t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, created_at, updated_at)
    VALUES (
        'service', 
        'The Bug Hunter', 
        'Identify logical flaws and edge cases', 
        'public', 
        'system', 
        ARRAY['debugging', 'qa'], 
        'coding', 
        NOW(), 
        NOW()
    )
    RETURNING id
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT id, 1, 'Examine the provided code snippet for logical errors, race conditions, memory leaks, and unhandled edge cases. Provide a prioritized list of issues with suggested fixes and explanations for why the error usage might be problematic.', NOW() 
FROM t;

-- Template 3: Test Suite Architect
WITH t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, created_at, updated_at)
    VALUES (
        'service', 
        'Test Suite Architect', 
        'Generate comprehensive test cases', 
        'public', 
        'system', 
        ARRAY['testing', 'qa'], 
        'coding', 
        NOW(), 
        NOW()
    )
    RETURNING id
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT id, 1, 'Generate a comprehensive test suite for the provided function or class. Include unit tests for happy paths, edge cases, and error conditions. Suggest property-based tests if applicable, and recommend mocking strategies for external dependencies.', NOW() 
FROM t;

-- Template 4: The Eloquent Editor
WITH t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, created_at, updated_at)
    VALUES (
        'service', 
        'The Eloquent Editor', 
        'Refine prose for clarity and impact', 
        'public', 
        'system', 
        ARRAY['writing', 'editing'], 
        'writing', 
        NOW(), 
        NOW()
    )
    RETURNING id
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT id, 1, 'Review the following text for clarity, tone, and impact. Improve the flow and sentence structure while maintaining the original voice. Highlight any passive voice usage or redundant phrasing that should be removed.', NOW() 
FROM t;

-- Template 5: Executive Summarizer
WITH t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, created_at, updated_at)
    VALUES (
        'service', 
        'Executive Summarizer', 
        'Synthesize complex information into key points', 
        'public', 
        'system', 
        ARRAY['writing', 'business'], 
        'writing', 
        NOW(), 
        NOW()
    )
    RETURNING id
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT id, 1, 'Summarize the provided text into a concise executive summary. Focus on the main arguments, key data points, and actionable conclusions. limit the output to bullet points and a single short paragraph for the final verdict.', NOW() 
FROM t;

-- Template 6: Creative Brainstorming Partner
WITH t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, created_at, updated_at)
    VALUES (
        'service', 
        'Creative Brainstorming Partner', 
        'Generate diverse ideas for a topic', 
        'public', 
        'system', 
        ARRAY['ideation', 'creative'], 
        'general', 
        NOW(), 
        NOW()
    )
    RETURNING id
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT id, 1, 'I need fresh ideas for the following topic/problem. Provide 10 distinct and creative concepts, ranging from practical to "moonshot" ideas. For each idea, briefly explain its potential unique selling point.', NOW() 
FROM t;

-- Template 7: Universal Component Generator
WITH t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, created_at, updated_at)
    VALUES (
        'service', 
        'Universal Component Generator', 
        'Create reusable frontend components', 
        'public', 
        'system', 
        ARRAY['coding', 'react'], 
        'frontend', 
        NOW(), 
        NOW()
    )
    RETURNING id
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT id, 1, 'Create a reusable UI component based on the description below. Include the implementation code (e.g., React/Vue), necessary styling (CSS/Tailwind), and details on the props interface. Ensure accessibility best practices (ARIA labels) are included.', NOW() 
FROM t;

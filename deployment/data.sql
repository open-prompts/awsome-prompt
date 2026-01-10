-- Seed Service User (password: mima4geqiu@)
INSERT INTO users (id, email, password_hash, display_name)
VALUES ('service', 'service@awsome-prompt.com', '$2b$12$19MuPOXGoEhu9vDQhcOFueJpfT3iKCVJH/BdslOkeGXgzQ2N4QDkS', 'Service Account')
ON CONFLICT (id) DO NOTHING;

-- Template 1: Technical Codebase Discovery
WITH t_data (owner_id, title, description, visibility, type, tags, category, language, content) AS (
    VALUES (
        'service',
        'Technical Codebase Discovery',
        'Analyze codebase structure and intent',
        'public',
        'system',
        ARRAY['coding', 'en', 'analysis']::text[],
        'coding', 
        'en',
        'Analyze the following codebase and provide a structural overview, identifying key design patterns, potential architectural bottlenecks, and the overall intent of the project. Highlight any unusual or innovative implementation details.'
    )
),
ins_t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, language, created_at, updated_at)
    SELECT owner_id, title, description, visibility, type, tags, category, language, NOW(), NOW()
    FROM t_data
    WHERE NOT EXISTS (SELECT 1 FROM templates WHERE owner_id = t_data.owner_id AND title = t_data.title)
    RETURNING id
),
sel_t AS (
    SELECT id FROM ins_t
    UNION ALL
    SELECT templates.id FROM templates
    JOIN t_data ON templates.owner_id = t_data.owner_id AND templates.title = t_data.title
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT sel_t.id, 1, t_data.content, NOW()
FROM sel_t, t_data
ON CONFLICT (template_id, version) DO NOTHING;

-- Template 2: The Bug Hunter
WITH t_data (owner_id, title, description, visibility, type, tags, category, language, content) AS (
    VALUES (
        'service',
        'The Bug Hunter',
        'Identify logical flaws and edge cases',
        'public',
        'system',
        ARRAY['debugging', 'qa']::text[],
        'coding', 
        'en',
        'Examine the provided code snippet for logical errors, race conditions, memory leaks, and unhandled edge cases. Provide a prioritized list of issues with suggested fixes and explanations for why the error usage might be problematic.'
    )
),
ins_t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, language, created_at, updated_at)
    SELECT owner_id, title, description, visibility, type, tags, category, language, NOW(), NOW()
    FROM t_data
    WHERE NOT EXISTS (SELECT 1 FROM templates WHERE owner_id = t_data.owner_id AND title = t_data.title)
    RETURNING id
),
sel_t AS (
    SELECT id FROM ins_t
    UNION ALL
    SELECT templates.id FROM templates
    JOIN t_data ON templates.owner_id = t_data.owner_id AND templates.title = t_data.title
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT sel_t.id, 1, t_data.content, NOW()
FROM sel_t, t_data
ON CONFLICT (template_id, version) DO NOTHING;

-- Template 3: Test Suite Architect
WITH t_data (owner_id, title, description, visibility, type, tags, category, language, content) AS (
    VALUES (
        'service',
        'Test Suite Architect',
        'Generate comprehensive test cases',
        'public',
        'system',
        ARRAY['testing', 'qa']::text[],
        'coding', 
        'en',
        'Generate a comprehensive test suite for the provided function or class. Include unit tests for happy paths, edge cases, and error conditions. Suggest property-based tests if applicable, and recommend mocking strategies for external dependencies.'
    )
),
ins_t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, language, created_at, updated_at)
    SELECT owner_id, title, description, visibility, type, tags, category, language, NOW(), NOW()
    FROM t_data
    WHERE NOT EXISTS (SELECT 1 FROM templates WHERE owner_id = t_data.owner_id AND title = t_data.title)
    RETURNING id
),
sel_t AS (
    SELECT id FROM ins_t
    UNION ALL
    SELECT templates.id FROM templates
    JOIN t_data ON templates.owner_id = t_data.owner_id AND templates.title = t_data.title
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT sel_t.id, 1, t_data.content, NOW()
FROM sel_t, t_data
ON CONFLICT (template_id, version) DO NOTHING;

-- Template 4: The Eloquent Editor
WITH t_data (owner_id, title, description, visibility, type, tags, category, language, content) AS (
    VALUES (
        'service',
        'The Eloquent Editor',
        'Refine prose for clarity and impact',
        'public',
        'system',
        ARRAY['writing', 'en', 'editing']::text[],
        'writing', 
        'en',
        'Review the following text for clarity, tone, and impact. Improve the flow and sentence structure while maintaining the original voice. Highlight any passive voice usage or redundant phrasing that should be removed.'
    )
),
ins_t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, language, created_at, updated_at)
    SELECT owner_id, title, description, visibility, type, tags, category, language, NOW(), NOW()
    FROM t_data
    WHERE NOT EXISTS (SELECT 1 FROM templates WHERE owner_id = t_data.owner_id AND title = t_data.title)
    RETURNING id
),
sel_t AS (
    SELECT id FROM ins_t
    UNION ALL
    SELECT templates.id FROM templates
    JOIN t_data ON templates.owner_id = t_data.owner_id AND templates.title = t_data.title
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT sel_t.id, 1, t_data.content, NOW()
FROM sel_t, t_data
ON CONFLICT (template_id, version) DO NOTHING;

-- Template 5: Executive Summarizer
WITH t_data (owner_id, title, description, visibility, type, tags, category, language, content) AS (
    VALUES (
        'service',
        'Executive Summarizer',
        'Synthesize complex information into key points',
        'public',
        'system',
        ARRAY['writing', 'en', 'business']::text[],
        'writing', 
        'en',
        'Summarize the provided text into a concise executive summary. Focus on the main arguments, key data points, and actionable conclusions. limit the output to bullet points and a single short paragraph for the final verdict.'
    )
),
ins_t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, language, created_at, updated_at)
    SELECT owner_id, title, description, visibility, type, tags, category, language, NOW(), NOW()
    FROM t_data
    WHERE NOT EXISTS (SELECT 1 FROM templates WHERE owner_id = t_data.owner_id AND title = t_data.title)
    RETURNING id
),
sel_t AS (
    SELECT id FROM ins_t
    UNION ALL
    SELECT templates.id FROM templates
    JOIN t_data ON templates.owner_id = t_data.owner_id AND templates.title = t_data.title
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT sel_t.id, 1, t_data.content, NOW()
FROM sel_t, t_data
ON CONFLICT (template_id, version) DO NOTHING;

-- Template 6: Creative Brainstorming Partner
WITH t_data (owner_id, title, description, visibility, type, tags, category, language, content) AS (
    VALUES (
        'service',
        'Creative Brainstorming Partner',
        'Generate diverse ideas for a topic',
        'public',
        'system',
        ARRAY['ideation', 'creative']::text[],
        'general', 
        'en',
        'I need fresh ideas for the following topic/problem. Provide 10 distinct and creative concepts, ranging from practical to "moonshot" ideas. For each idea, briefly explain its potential unique selling point.'
    )
),
ins_t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, language, created_at, updated_at)
    SELECT owner_id, title, description, visibility, type, tags, category, language, NOW(), NOW()
    FROM t_data
    WHERE NOT EXISTS (SELECT 1 FROM templates WHERE owner_id = t_data.owner_id AND title = t_data.title)
    RETURNING id
),
sel_t AS (
    SELECT id FROM ins_t
    UNION ALL
    SELECT templates.id FROM templates
    JOIN t_data ON templates.owner_id = t_data.owner_id AND templates.title = t_data.title
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT sel_t.id, 1, t_data.content, NOW()
FROM sel_t, t_data
ON CONFLICT (template_id, version) DO NOTHING;

-- Template 7: Universal Component Generator
WITH t_data (owner_id, title, description, visibility, type, tags, category, language, content) AS (
    VALUES (
        'service',
        'Universal Component Generator',
        'Create reusable frontend components',
        'public',
        'system',
        ARRAY['coding', 'en', 'react']::text[],
        'frontend', 
        'en',
        'Create a reusable UI component based on the description below. Include the implementation code (e.g., React/Vue), necessary styling (CSS/Tailwind), and details on the props interface. Ensure accessibility best practices (ARIA labels) are included.'
    )
),
ins_t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, language, created_at, updated_at)
    SELECT owner_id, title, description, visibility, type, tags, category, language, NOW(), NOW()
    FROM t_data
    WHERE NOT EXISTS (SELECT 1 FROM templates WHERE owner_id = t_data.owner_id AND title = t_data.title)
    RETURNING id
),
sel_t AS (
    SELECT id FROM ins_t
    UNION ALL
    SELECT templates.id FROM templates
    JOIN t_data ON templates.owner_id = t_data.owner_id AND templates.title = t_data.title
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT sel_t.id, 1, t_data.content, NOW()
FROM sel_t, t_data
ON CONFLICT (template_id, version) DO NOTHING;

-- Template: English Translator and Improver
WITH t_data (owner_id, title, description, visibility, type, tags, category, language, content) AS (
    VALUES (
        'service',
        '英语翻译与润色',
        '将英语翻译并润色得更具文学性和雅致',
        'public',
        'system',
        ARRAY['写作', '翻译', '英语']::text[],
        '写作',
        'zh',
        '我希望你能担任英语翻译、拼写校对和修辞改进的角色。我会用任何语言和你交流，你会识别语言，将其翻译并用更为优美和精炼的英语回答我。请将我简单的词汇和句子替换成更为优美和高雅的表达方式，确保意思不变，但使其更具文学性。请仅回答更正和改进的部分，不要写解释。我的第一句话是 "$$"'
    )
),
ins_t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, language, created_at, updated_at)
    SELECT owner_id, title, description, visibility, type, tags, category, language, NOW(), NOW()
    FROM t_data
    WHERE NOT EXISTS (SELECT 1 FROM templates WHERE owner_id = t_data.owner_id AND title = t_data.title)
    RETURNING id
),
sel_t AS (
    SELECT id FROM ins_t
    UNION ALL
    SELECT templates.id FROM templates
    JOIN t_data ON templates.owner_id = t_data.owner_id AND templates.title = t_data.title
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT sel_t.id, 1, t_data.content, NOW()
FROM sel_t, t_data
ON CONFLICT (template_id, version) DO NOTHING;

-- Template: Linux Terminal
WITH t_data (owner_id, title, description, visibility, type, tags, category, language, content) AS (
    VALUES (
        'service',
        'Linux 终端模拟器',
        '充当 Linux 终端，仅返回终端输出',
        'public',
        'system',
        ARRAY['编程', 'Linux', '工具']::text[],
        '编程',
        'zh',
        '我想让你充当 Linux 终端。我将输入命令，您将回复终端应显示的内容。我希望您只在一个唯一的代码块内回复终端输出，而不是其他任何内容。不要写解释。除非我指示您这样做，否则不要键入命令。当我需要用英语告诉你一些事情时，我会把文字放在中括号内[就像这样]。我的第一个命令是 $$'
    )
),
ins_t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, language, created_at, updated_at)
    SELECT owner_id, title, description, visibility, type, tags, category, language, NOW(), NOW()
    FROM t_data
    WHERE NOT EXISTS (SELECT 1 FROM templates WHERE owner_id = t_data.owner_id AND title = t_data.title)
    RETURNING id
),
sel_t AS (
    SELECT id FROM ins_t
    UNION ALL
    SELECT templates.id FROM templates
    JOIN t_data ON templates.owner_id = t_data.owner_id AND templates.title = t_data.title
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT sel_t.id, 1, t_data.content, NOW()
FROM sel_t, t_data
ON CONFLICT (template_id, version) DO NOTHING;

-- Template: Academic Paper Polisher
WITH t_data (owner_id, title, description, visibility, type, tags, category, language, content) AS (
    VALUES (
        'service',
        '学术论文润色',
        '润色学术论文摘要，使其流畅优美',
        'public',
        'system',
        ARRAY['学术', '写作']::text[],
        '写作',
        'zh',
        '请你充当一名论文编辑专家，在论文评审的角度去修改论文摘要部分，使其更加流畅，优美。能让读者快速获得文章的要点或精髓，让文章引人入胜；能让读者了解全文中的重要信息、分析和论点；帮助读者记住论文的要点。下文是论文的摘要部分，请你修改它：$$'
    )
),
ins_t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, language, created_at, updated_at)
    SELECT owner_id, title, description, visibility, type, tags, category, language, NOW(), NOW()
    FROM t_data
    WHERE NOT EXISTS (SELECT 1 FROM templates WHERE owner_id = t_data.owner_id AND title = t_data.title)
    RETURNING id
),
sel_t AS (
    SELECT id FROM ins_t
    UNION ALL
    SELECT templates.id FROM templates
    JOIN t_data ON templates.owner_id = t_data.owner_id AND templates.title = t_data.title
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT sel_t.id, 1, t_data.content, NOW()
FROM sel_t, t_data
ON CONFLICT (template_id, version) DO NOTHING;

-- Template: Job Interviewer
WITH t_data (owner_id, title, description, visibility, type, tags, category, language, content) AS (
    VALUES (
        'service',
        '面试官',
        '模拟特定职位的求职面试',
        'public',
        'system',
        ARRAY['职业', '面试']::text[],
        '生产力',
        'zh',
        '我想让你担任$$面试官。我将成为候选人，您将向我询问该职位的面试问题。我希望你只作为面试官回答。不要一次写出所有的问题。我希望你只对我进行采访。问我问题，等待我的回答。不要写解释。像面试官一样一个一个问我，等我回答。我的第一句话是“面试官你好”'
    )
),
ins_t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, language, created_at, updated_at)
    SELECT owner_id, title, description, visibility, type, tags, category, language, NOW(), NOW()
    FROM t_data
    WHERE NOT EXISTS (SELECT 1 FROM templates WHERE owner_id = t_data.owner_id AND title = t_data.title)
    RETURNING id
),
sel_t AS (
    SELECT id FROM ins_t
    UNION ALL
    SELECT templates.id FROM templates
    JOIN t_data ON templates.owner_id = t_data.owner_id AND templates.title = t_data.title
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT sel_t.id, 1, t_data.content, NOW()
FROM sel_t, t_data
ON CONFLICT (template_id, version) DO NOTHING;

-- Template: Fancy Title Generator
WITH t_data (owner_id, title, description, visibility, type, tags, category, language, content) AS (
    VALUES (
        'service',
        '创意标题生成器',
        '根据关键词生成创意标题',
        'public',
        'system',
        ARRAY['创意', '营销']::text[],
        '写作',
        'zh',
        '我想让你充当一个花哨的标题生成器。我会用逗号输入关键字，你会用花哨的标题回复。我的关键字是：$$'
    )
),
ins_t AS (
    INSERT INTO templates (owner_id, title, description, visibility, type, tags, category, language, created_at, updated_at)
    SELECT owner_id, title, description, visibility, type, tags, category, language, NOW(), NOW()
    FROM t_data
    WHERE NOT EXISTS (SELECT 1 FROM templates WHERE owner_id = t_data.owner_id AND title = t_data.title)
    RETURNING id
),
sel_t AS (
    SELECT id FROM ins_t
    UNION ALL
    SELECT templates.id FROM templates
    JOIN t_data ON templates.owner_id = t_data.owner_id AND templates.title = t_data.title
)
INSERT INTO template_versions (template_id, version, content, created_at)
SELECT sel_t.id, 1, t_data.content, NOW()
FROM sel_t, t_data
ON CONFLICT (template_id, version) DO NOTHING;

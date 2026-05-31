-- SEED DATA: Chinese High School Knowledge Graph (fixed UUIDs)
-- Subjects
INSERT INTO subjects (id, name, grade, display_order) VALUES
  ('051ba2e9-9539-4cdc-a234-4d9511fba8ae', '数学', '高一', 1),
  ('532b1003-0e84-4c51-8ae6-cfe5e84898a2', '语文', '高一', 2),
  ('420931e3-c216-4726-96b7-90901b0f7ab3', '英语', '高一', 3),
  ('1753d86e-22a1-4458-a227-5bc8a8871d25', '物理', '高一', 4),
  ('729e6e3c-5d8e-4d43-9939-c0640c9a4195', '化学', '高一', 5),
  ('24f60511-2bb4-4c52-8ca6-0b4373b95f22', '数学', '高二', 1),
  ('881f053c-95df-4e1c-864e-7cbf26325f05', '语文', '高二', 2),
  ('3aa4339d-e851-4bb3-98a2-412e6246f3d8', '英语', '高二', 3),
  ('45d436a9-864b-4df4-8c28-8870ba81e86c', '物理', '高二', 4),
  ('5f02be75-7efd-45d5-bb9a-2bbf6d971de1', '化学', '高二', 5),
  ('81b48a96-6faa-429a-bdd0-a8256ce24dd5', '数学', '高三', 1),
  ('97fbfcf6-325b-4ec1-bed6-2639e8272a53', '语文', '高三', 2),
  ('9411f507-1cb7-4659-85c7-70891b8fbacf', '英语', '高三', 3),
  ('3b434da1-cecf-4d98-b3da-0a2cbe9cfdcb', '物理', '高三', 4),
  ('3e66e874-e1ef-4626-ab90-193f4b0bd29e', '化学', '高三', 5);

-- Chapter 1: 集合与常用逻辑用语
INSERT INTO chapters (id, subject_id, title, display_order) VALUES
  ('2bd66016-0473-4291-9536-b6ffc99aaf84', '051ba2e9-9539-4cdc-a234-4d9511fba8ae', '第一章 集合与常用逻辑用语', 1);
INSERT INTO knowledge_points (id, chapter_id, title, tag, description, display_order) VALUES
  ('e641c736-4159-4b6f-8d9f-afd0582afb13', '2bd66016-0473-4291-9536-b6ffc99aaf84', '集合的含义与表示', 'required', '集合的概念、元素与集合的关系、集合的表示法（列举法、描述法）', 1),
  ('93c54d30-61b3-435e-adff-c598db18f559', '2bd66016-0473-4291-9536-b6ffc99aaf84', '集合间的基本关系', 'required', '子集、真子集、集合相等、空集', 2),
  ('2b380b1e-e990-47cd-88d6-af6fb9a04fe7', '2bd66016-0473-4291-9536-b6ffc99aaf84', '集合的基本运算', 'required', '并集、交集、补集、全集', 3),
  ('f3118100-abc3-4966-97af-1771898ef25d', '2bd66016-0473-4291-9536-b6ffc99aaf84', '充分条件与必要条件', 'common', '充分条件、必要条件、充要条件的判断', 4),
  ('2dcc69c3-a9c6-4076-bf77-cd68bac84bc2', '2bd66016-0473-4291-9536-b6ffc99aaf84', '全称量词与存在量词', 'difficult', '全称量词命题与存在量词命题的否定', 5);

-- Chapter 2: 一元二次函数、方程和不等式
INSERT INTO chapters (id, subject_id, title, display_order) VALUES
  ('e7cf1827-c895-4170-8bda-395d4c8a8f14', '051ba2e9-9539-4cdc-a234-4d9511fba8ae', '第二章 一元二次函数、方程和不等式', 2);
INSERT INTO knowledge_points (id, chapter_id, title, tag, description, display_order) VALUES
  ('e35926c1-437c-4c23-b023-35b049fa823c', 'e7cf1827-c895-4170-8bda-395d4c8a8f14', '等式性质与不等式性质', 'required', '等式的基本性质、不等式的基本性质及其推论', 1),
  ('977f9442-2bec-49ef-b39f-7698bff9dd67', 'e7cf1827-c895-4170-8bda-395d4c8a8f14', '基本不等式', 'required', '基本不等式（均值不等式）及其应用，最值问题', 2),
  ('e262d619-e6f2-4568-8972-ec8c4c9c4646', 'e7cf1827-c895-4170-8bda-395d4c8a8f14', '二次函数与一元二次方程', 'required', '二次函数的图像与性质、判别式、韦达定理', 3),
  ('1fd1d0a4-7eba-4f09-ab08-974b886ee041', 'e7cf1827-c895-4170-8bda-395d4c8a8f14', '一元二次不等式', 'common', '一元二次不等式的解法（图像法、区间法）', 4),
  ('b475c199-7412-4f95-8b52-c4d5a9c71eb7', 'e7cf1827-c895-4170-8bda-395d4c8a8f14', '分式不等式与高次不等式', 'difficult', '分式不等式化为整式不等式、穿根法', 5);

-- Chapter 3: 函数的概念与性质
INSERT INTO chapters (id, subject_id, title, display_order) VALUES
  ('87126206-7af7-4fa3-8da6-2f9214b20338', '051ba2e9-9539-4cdc-a234-4d9511fba8ae', '第三章 函数的概念与性质', 3);
INSERT INTO knowledge_points (id, chapter_id, title, tag, description, display_order) VALUES
  ('5476d5d1-db32-4afe-a645-bb0961492a8e', '87126206-7af7-4fa3-8da6-2f9214b20338', '函数的概念', 'required', '函数的定义、定义域、值域、函数相等', 1),
  ('56eb9e17-dd2a-4e1b-acf1-5ff0ff8d2779', '87126206-7af7-4fa3-8da6-2f9214b20338', '函数的表示法', 'required', '解析法、列表法、图像法、分段函数', 2),
  ('658ca443-1b4e-42da-a673-c3752caa0f83', '87126206-7af7-4fa3-8da6-2f9214b20338', '函数的单调性', 'required', '增函数、减函数的定义与判断、单调区间', 3),
  ('26d12271-60b5-4759-bfc9-b11f6269149b', '87126206-7af7-4fa3-8da6-2f9214b20338', '函数的奇偶性', 'required', '奇函数、偶函数的定义与判定、图像特征', 4),
  ('de369f4d-3d9a-421e-bf48-a5b0a2899edd', '87126206-7af7-4fa3-8da6-2f9214b20338', '幂函数', 'common', '幂函数的概念、图像与性质', 5),
  ('b7fce312-5cd0-477b-9e3b-1a1ed003f247', '87126206-7af7-4fa3-8da6-2f9214b20338', '函数的最值', 'difficult', '最大值、最小值的概念与求法', 6);

-- Chapter 4: 指数函数与对数函数
INSERT INTO chapters (id, subject_id, title, display_order) VALUES
  ('e2985b70-585e-4f68-8390-92e68c782faf', '051ba2e9-9539-4cdc-a234-4d9511fba8ae', '第四章 指数函数与对数函数', 4);
INSERT INTO knowledge_points (id, chapter_id, title, tag, description, display_order) VALUES
  ('cfb43912-daec-489a-b1fb-0455c25c4156', 'e2985b70-585e-4f68-8390-92e68c782faf', '指数与指数幂的运算', 'required', '根式、分数指数幂、指数运算性质', 1),
  ('c2d4d641-b48f-4aa7-bd9e-f2d44de5f6eb', 'e2985b70-585e-4f68-8390-92e68c782faf', '指数函数及其性质', 'required', '指数函数的图像、定义域、值域、单调性', 2),
  ('1d8d300d-3b0c-48af-af9b-58e262b3d2f6', 'e2985b70-585e-4f68-8390-92e68c782faf', '对数与对数运算', 'required', '对数的概念、对数恒等式、换底公式', 3),
  ('211e5282-e1cf-434d-a1d6-259f5bf94e34', 'e2985b70-585e-4f68-8390-92e68c782faf', '对数函数及其性质', 'required', '对数函数的图像、定义域、值域、单调性', 4),
  ('1153900c-39af-446d-9cf3-577770ada566', 'e2985b70-585e-4f68-8390-92e68c782faf', '指数函数与对数函数的关系', 'common', '反函数的概念、指数与对数的互化', 5),
  ('4207c358-e28e-4fb1-8419-346e732f5481', 'e2985b70-585e-4f68-8390-92e68c782faf', '函数的应用', 'difficult', '函数模型的实际应用问题（增长率、衰减等）', 6);

-- Chapter 5: 三角函数
INSERT INTO chapters (id, subject_id, title, display_order) VALUES
  ('726d4896-e583-496a-8a85-11f53471578a', '051ba2e9-9539-4cdc-a234-4d9511fba8ae', '第五章 三角函数', 5);
INSERT INTO knowledge_points (id, chapter_id, title, tag, description, display_order) VALUES
  ('0fd77771-88a1-4fbf-92f9-08bb2b4e9d4c', '726d4896-e583-496a-8a85-11f53471578a', '任意角和弧度制', 'required', '正角、负角、零角、弧度制及其与角度的换算', 1),
  ('596c064d-b181-4910-b8b4-35ef8e2fe5a1', '726d4896-e583-496a-8a85-11f53471578a', '任意角的三角函数', 'required', '正弦、余弦、正切的定义、单位圆、三角函数线', 2),
  ('f45c189f-1a67-4e08-b719-4c2fe9e4dcc1', '726d4896-e583-496a-8a85-11f53471578a', '同角三角函数的基本关系', 'required', '平方关系、商数关系', 3),
  ('a1e1885f-fa34-4aa9-a728-0b0c6f8a68b1', '726d4896-e583-496a-8a85-11f53471578a', '三角函数的诱导公式', 'common', '诱导公式及应用', 4),
  ('8a9ceed3-6b1d-4985-a98f-57b2b80ba9b7', '726d4896-e583-496a-8a85-11f53471578a', '三角函数的图像与性质', 'required', '正弦曲线、余弦曲线、周期性、最值', 5),
  ('d0abc5c4-b977-4525-a3a5-2f690151ea22', '726d4896-e583-496a-8a85-11f53471578a', '函数y=Asin(ωx+φ)的图像', 'difficult', '振幅变换、周期变换、平移变换', 6),
  ('b22bd58f-0d7c-4e3f-8831-c17a22a0e3cb', '726d4896-e583-496a-8a85-11f53471578a', '三角函数的应用', 'common', '简谐运动、交流电等实际应用', 7);

# 문구를 고칠 때

- 화면에 나가는 문장은 `src/content/copy.mjs`·`src/content/metric.mjs`·`src/content/posts.mjs`·`data/courses.json` 과 `src/pages/site.mjs`·`course.mjs` 에 있다.
- **다른 사이트와 한 문장도, 문장 골격도 겹치면 안 된다.** 고친 뒤에는 반드시:

```bash
cd /data/wwwroot/oasisknot
sh /tmp/cyc.sh oasisknot 60                 # 문장 완전일치 + 소스 역추적(범인 소스 0)
python3 /tmp/skel4.py oasisknot <상대사이트들…>   # 단어만 바꾼 골격 중복(0)
```

- 허용되는 예외는 전화 버튼 줄(`예약 문의 050-…`) 하나뿐이다.
- 지명·코스 이름 뒤에 조사를 붙일 때는 반드시 `josa()` 를 쓴다. 맨 '은/는/이/가/로' 금지.
- 숫자가 **0이 될 수 있는 자리**는 전부 0 분기를 둔다(동이 0인 군, 시군구가 하나뿐인 시도 등).
- 마크다운 별표는 화면에 그대로 찍힌다. 굵게는 `<strong>` 으로.

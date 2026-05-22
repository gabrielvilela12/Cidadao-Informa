# AI Priority Classification - Deployment Checklist

## Pre-Deployment

### Environment Variables
- [ ] `OPENROUTER_API_KEY` set in production `.env` (not example)
- [ ] `SUPABASE_EDGE_FUNCTION_URL` configured (production URL)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` secured in backend
- [ ] `SUPABASE_ANON_KEY` available for frontend

### Database
- [ ] All 3 migrations applied to production Supabase:
  - [ ] 20260522000001_create_ai_priority_jobs.sql
  - [ ] 20260522000002_create_ai_job_logs.sql
  - [ ] 20260522000003_add_priority_to_protocols.sql
- [ ] RLS policies verified in Supabase dashboard
- [ ] Indexes created and query performance tested
- [ ] Verify via: SELECT COUNT(*) FROM ai_priority_jobs;

### Edge Function
- [ ] Edge Function deployed to production Supabase
- [ ] Test trigger via curl:
  ```bash
  curl -X POST https://[supabase-project].supabase.co/functions/v1/classify-priority \
    -H "Content-Type: application/json" \
    -d '{"protocol_id":"test-uuid","description":"test","category":"test"}'
  ```
- [ ] Verify response is 200 OK
- [ ] Check logs in Supabase dashboard for errors
- [ ] Confirm OPENROUTER_API_KEY is set in Edge Function secrets

### Backend Spring Boot
- [ ] All JPA entities compiled without errors
- [ ] Repositories autowire correctly in Spring context
- [ ] AiPriorityService instantiates with RestClient bean
- [ ] AiPriorityController endpoints respond:
  - [ ] `PUT /api/ai-priority/manual/{protocolId}` → 200 OK
  - [ ] `POST /api/ai-priority/regenerate/{protocolId}` → 200 OK
  - [ ] `GET /api/ai-priority/logs` → 200 OK with data
  - [ ] `GET /api/ai-priority/jobs/failed` → 200 OK
- [ ] Scheduled task (@EnableScheduling) enabled in main app class
- [ ] Test with Postman/curl for each endpoint

### Frontend
- [ ] All TypeScript files compile without errors (no type errors)
- [ ] `npm run build` succeeds without warnings
- [ ] Import paths correct for new components:
  - [ ] PriorityBadge imports correctly
  - [ ] PrioritySection imports correctly
  - [ ] AiLogsPage imports correctly
- [ ] Routes added for admin pages:
  - [ ] `/admin/ai-logs` route exists
  - [ ] Navigation link present in sidebar
- [ ] Responsive design verified on mobile (test in DevTools)

## Deployment Steps

### Step 1: Deploy Supabase Migrations
```bash
cd supabase
supabase migration up
# Verify: SELECT column_name FROM information_schema.columns WHERE table_name='ai_priority_jobs';
```

### Step 2: Deploy Edge Function
```bash
supabase functions deploy classify-priority
# Verify: Edge Function appears in Supabase dashboard
```

### Step 3: Set Edge Function Secrets
In Supabase dashboard → Edge Functions → classify-priority → Secrets:
- Add `OPENROUTER_API_KEY` = your actual key

### Step 4: Deploy Backend
```bash
cd backend-java
mvn clean package
# Upload JAR to production server
# Restart service
```

### Step 5: Deploy Frontend
```bash
npm run build
# Verify: dist/ folder created
# Deploy to Vercel or hosting provider
```

## Post-Deployment Verification

### Smoke Test Sequence
1. **Create solicitação as citizen:**
   - [ ] Navigate to citizen app
   - [ ] Fill out new solicitação form
   - [ ] Click submit
   - [ ] Protocol number appears immediately ✅

2. **Check admin queue (wait 10 seconds):**
   - [ ] Login as admin
   - [ ] Go to "Fila de Solicitações"
   - [ ] Find protocol from step 1
   - [ ] Priority badge visible with color ✅

3. **Check protocol detail page:**
   - [ ] Click on protocol
   - [ ] Scroll to "Prioridade" section
   - [ ] Badge shows correct priority ✅
   - [ ] "Regenerar IA" button present ✅
   - [ ] "Trocar" button present ✅

4. **Test manual override:**
   - [ ] Click "Trocar"
   - [ ] Select different priority
   - [ ] Enter reason
   - [ ] Click save
   - [ ] Priority updates immediately ✅

5. **Check AI Logs page:**
   - [ ] Go to Admin → Logs IA
   - [ ] Find protocol from steps above
   - [ ] See entry from IA classification ✅
   - [ ] See entry from manual override ✅
   - [ ] Reason logged correctly ✅

6. **Test error handling:**
   - [ ] Temporarily disable Edge Function
   - [ ] Create new solicitação
   - [ ] Wait 10 seconds
   - [ ] Admin queue shows ⚠️ "IA Falhou" ✅
   - [ ] Admin can still manually set priority ✅

7. **Monitor logs:**
   - [ ] Check backend logs for errors: `docker logs [container]`
   - [ ] Check Edge Function logs in Supabase dashboard
   - [ ] No 500 errors in server logs ✅

## Rollback Plan

### If Edge Function fails:
1. Disable Edge Function in Supabase dashboard
2. Solicitações still reach admin without priority (ai_status = failed)
3. Admin can manually set priority via "Trocar" button
4. No data loss

### If database migration fails:
1. Don't re-run migrations
2. Restore from backup if needed
3. Check migration logs for specific error
4. Fix and re-apply

### If backend fails:
1. Rollback to previous JAR version
2. Restart service
3. Frontend continues working (will see "IA Falhou" for new solicitações)

### If frontend fails:
1. Rollback to previous Vercel deployment
2. Check browser console for errors
3. Verify API endpoints still respond

## Performance Targets

- **AI classification latency:** < 5 seconds (95th percentile)
- **Admin sees priority:** Within 10 seconds of citizen submission
- **Manual override:** Immediate (< 1 second)
- **Audit logs page:** Load < 2 seconds for 30 days

## Post-Launch Monitoring

- [ ] Set up error alerts for Edge Function failures
- [ ] Monitor OpenRouter API usage and costs
- [ ] Track classification accuracy (compare admin overrides to AI)
- [ ] Monitor retry task success rate (should be ~95%+)
- [ ] Weekly review of AI Logs for patterns

## Contacts & Escalation

- **OpenRouter API Issues:** Check https://status.openrouter.ai
- **Supabase Issues:** Check https://status.supabase.com
- **Backend Issues:** Check server logs and Spring Boot actuator (/actuator/health)
- **Frontend Issues:** Check browser DevTools and Vercel deployment logs

---

**Deployment Date:** [TO BE FILLED]
**Deployed By:** [DEVELOPER NAME]
**Verified By:** [QA NAME]

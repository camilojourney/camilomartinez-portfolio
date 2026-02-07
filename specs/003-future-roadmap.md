# 003 - Future Roadmap

## Phases (from AGENTS.md)

### MVP (Complete: 0-8 weeks)
- ✅ Core ingestion, views, reliability.

### V1.5 (8-16 weeks: In Progress)
- Automation expansion.
- UX improvements.

### V2 (16+ weeks)
- Multi-env hardening.
- Operational maturity.

## Potential Improvements

### High Impact (Next Sprint)
1. **Multi-User Support**
   - User accounts, data isolation.
   - Tech: Row-level security (Postgres).

2. **Mobile App**
   - React Native or PWA enhancements.
   - Push notifications (Celery).

3. **Advanced AI**
   - Fine-tuned models (beyond GPT-4).
   - Predictive analytics (HRV trends).

### Medium Term
1. **More Integrations**
   - Garmin, Apple Health.
   - Nutrition APIs.

2. **Real-Time**
   - WebSockets (FastAPI).
   - Live workout tracking.

3. **Monetization**
   - Stripe subscriptions.
   - Premium AI insights.

### Long Term
1. **Federated Learning**
   - Anonymized user data for model improvement.

2. **AR/VR Workouts**
   - Spatial computing integration.

## Prioritization Matrix

| Feature | Effort | Impact | Priority |
|---------|--------|--------|----------|
| Multi-User | Medium | High | 1 |
| Mobile PWA | Low | High | 1 |
| More Integrations | Medium | Medium | 2 |
| Real-Time | High | High | 2 |
| Fine-Tuning | High | High | 3 |

## Acceptance Criteria
- [ ] V1.5: 90% test coverage.
- [ ] User onboarding flow.
- [ ] A/B testing framework.
- [ ] CI/CD full automation (.github/workflows).

# Bizim Skor Invite Growth Design

## Goal
Reach 100 players who complete predictions every week within 8 weeks while keeping Bizim Skor free.

## Approved scope
1. Personal invite links.
2. Monthly and season-long “En Çok Arkadaş Getirenler” rankings.
3. Shareable weekly result card using the approved **A — Lacivert Premium** visual direction.

## Invite flow
- A signed-in player can choose **Oyuna Davet Et** or **Bu Lige Davet Et**.
- Game invite registers a new player only.
- League invite registers the new player and joins the selected friend league.
- Attribution belongs to the player whose invite link was used.
- Only a first-time real player registration counts.
- The same player can never count twice.
- Self-invites never count.
- Invite attribution must be stored separately from prediction/scoring state so existing scoring and leagues remain unaffected.

## Rankings and badge
- Monthly invite leaderboard and season invite leaderboard.
- Monthly #1 receives the **Davet Şampiyonu** badge.
- The monthly champion is announced on the home screen.
- No cash or gift reward.
- Ranking UI follows the Lacivert Premium visual language.

## Weekly result card
The shareable card contains:
- username
- week
- points earned
- exact-score count
- correct-result count
- weekly rank
- overall rank
- rank movement (up/down/no change)
- personal invite link

WhatsApp sharing uses the player’s personal invite link. The selected visual is **A — Lacivert Premium**.

## Safety and rollout
- Do not change production directly.
- Preserve the current production commit as the rollback point.
- Build on an isolated feature branch.
- Add automated tests for attribution uniqueness, self-invite prevention, league invite behavior, ranking aggregation, badge selection and result-card data.
- Validate in Preview before production.
- Production deployment requires explicit user approval after Preview review.

## Rollback point
Production/main baseline at design start: `cc466ba18d69144173841bde5dd4e460b4bf91b1`.
Feature branch: `feature/invite-growth-v1`.

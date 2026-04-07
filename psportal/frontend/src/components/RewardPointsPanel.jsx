import React, { useMemo } from "react";
import { Activity, BarChart3, Target } from "lucide-react";

function fmt2(n) {
    if (n == null || Number.isNaN(Number(n))) return "0.00";
    return Number(n).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function fmtInt(n) {
    if (n == null || Number.isNaN(Number(n))) return "0";
    return Number(n).toLocaleString();
}

export default function RewardPointsPanel({ profile, rewardPoints }) {
    const rp = rewardPoints || {};
    const breakdownRows = rp.breakdownRows || [];
    const detailedActivities = rp.detailedActivities || [];

    const lastUpdatedStr = useMemo(() => {
        const d = rp.lastUpdated ? new Date(rp.lastUpdated) : new Date();
        return d.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "medium",
        });
    }, [rp.lastUpdated]);

    const dataAgeHours = useMemo(() => {
        const d = rp.lastUpdated ? new Date(rp.lastUpdated) : new Date();
        return ((Date.now() - d.getTime()) / 3600000).toFixed(1);
    }, [rp.lastUpdated]);

    return (
        <div className="sd-rp">
            <section className="sd-rp-your-details sd-card sd-card-white">
                <h3 className="sd-rp-your-title">Your details</h3>
                <dl className="sd-rp-dl">
                    <div>
                        <dt>Roll no.</dt>
                        <dd>{profile?.register_no || "—"}</dd>
                    </div>
                    <div>
                        <dt>Student name</dt>
                        <dd>{profile?.name || "—"}</dd>
                    </div>
                    <div>
                        <dt>Year</dt>
                        <dd>{profile?.year || rp.year || "—"}</dd>
                    </div>
                    <div>
                        <dt>Department</dt>
                        <dd>{(profile?.department || "—").toUpperCase()}</dd>
                    </div>
                    <div>
                        <dt>Mentor name</dt>
                        <dd>{rp.mentorName || "—"}</dd>
                    </div>
                    <div>
                        <dt>Cumulative reward points</dt>
                        <dd>{fmt2(rp.cumulative)}</dd>
                    </div>
                    <div>
                        <dt>Redeemed points</dt>
                        <dd>{fmt2(rp.redeemed)}</dd>
                    </div>
                    <div>
                        <dt>Balance points</dt>
                        <dd className="sd-rp-balance-dd">{fmt2(rp.balance)}</dd>
                    </div>
                </dl>
            </section>

            <section className="sd-rp-summary-row">
                <div className="sd-rp-mini sd-rp-mini--orange">
                    <span className="sd-rp-mini-k">Cumulative points</span>
                    <strong className="sd-rp-mini-v">{fmtInt(rp.cumulative)}</strong>
                </div>
                <div className="sd-rp-mini sd-rp-mini--red">
                    <span className="sd-rp-mini-k">Redeemed</span>
                    <strong className="sd-rp-mini-v sd-rp-mini-v--red">
                        {fmtInt(rp.redeemed)}
                    </strong>
                </div>
                <div className="sd-rp-mini sd-rp-mini--green">
                    <span className="sd-rp-mini-k">Balance</span>
                    <strong className="sd-rp-mini-v sd-rp-mini-v--green">
                        {fmtInt(rp.balance)}
                    </strong>
                </div>
            </section>

            <section className="sd-rp-goal-card">
                <div className="sd-rp-goal-left">
                    <div className="sd-rp-goal-title">
                        <Target className="sd-rp-goal-ico" size={22} aria-hidden />
                        <div>
                            <h3>Year {profile?.year || rp.year || "—"} average</h3>
                            <p className="sd-rp-goal-sub">
                                Average reward points for Year {profile?.year || rp.year || "—"}{" "}
                                students
                            </p>
                        </div>
                    </div>
                    <p className="sd-rp-goal-big">{fmtInt(rp.yearAverageReward)} points</p>
                </div>
                <div className="sd-rp-goal-callout">
                    <div className="sd-rp-goal-callout-ico" aria-hidden>
                        !
                    </div>
                    <div>
                        <span className="sd-rp-goal-callout-label">Points needed</span>
                        <strong className="sd-rp-goal-callout-val">
                            {fmtInt(rp.pointsNeededToAverage)}
                        </strong>
                    </div>
                </div>
            </section>

            <section className="sd-rp-tips">
                <h4>Ways to earn points</h4>
                <ul>
                    <li>PS Activities</li>
                    <li>TAC</li>
                    <li>Hackathons / Technical Events</li>
                    <li>Project Competitions</li>
                    <li>Refer to Reward Points Breakdown for more detail</li>
                </ul>
            </section>

            <section className="sd-card sd-card-white sd-rp-block">
                <div className="sd-rp-block-head">
                    <Activity size={18} className="sd-rp-block-ico" aria-hidden />
                    <div>
                        <h2 className="sd-rp-block-title">Detailed activity list</h2>
                        <p className="sd-rp-block-sub">
                            Activities contributing to your reward points
                        </p>
                    </div>
                </div>
                {detailedActivities.length === 0 ? (
                    <p className="sd-rp-empty">
                        No Student Initiatives activities recorded yet. Other transactions
                        still count toward category totals below.
                    </p>
                ) : (
                    <ol className="sd-rp-act-list">
                        {detailedActivities.map((row, i) => (
                            <li key={i} className="sd-rp-act-item">
                                <span className="sd-rp-act-num">{i + 1}</span>
                                <span className="sd-rp-act-title">{row.title}</span>
                                <span className="sd-rp-act-pts">
                                    <strong>{fmt2(row.points)}</strong>
                                    <small>pts</small>
                                </span>
                            </li>
                        ))}
                    </ol>
                )}
                <div className="sd-rp-act-total">
                    <span>Total from activities</span>
                    <strong>{fmt2(rp.activitiesTotal)}</strong>
                </div>
            </section>

            <section className="sd-card sd-card-white sd-rp-block">
                <div className="sd-rp-block-head">
                    <BarChart3 size={18} className="sd-rp-block-ico" aria-hidden />
                    <div>
                        <h2 className="sd-rp-block-title">Reward points breakdown</h2>
                        <p className="sd-rp-block-sub">Complete breakdown by category</p>
                    </div>
                </div>
                <div className="sd-rp-table-wrap">
                    <table className="sd-rp-table">
                        <thead>
                            <tr>
                                <th>Category</th>
                                <th className="sd-rp-th-num">Count</th>
                                <th className="sd-rp-th-num">Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {breakdownRows.map((row) => (
                                <tr
                                    key={row.key}
                                    className={`sd-rp-tr sd-rp-tr--${row.style || "default"}`}
                                >
                                    <td className="sd-rp-cat">{row.category}</td>
                                    <td className="sd-rp-num">{row.countDisplay ?? "—"}</td>
                                    <td
                                        className={`sd-rp-num sd-rp-points ${
                                            row.style === "penalty"
                                                ? "sd-rp-points--bad"
                                                : ""
                                        } ${
                                            row.style === "total" ||
                                            row.style === "cumulative"
                                                ? "sd-rp-points--orange"
                                                : ""
                                        } ${
                                            row.style === "balance"
                                                ? "sd-rp-points--green"
                                                : ""
                                        }`}
                                    >
                                        {fmt2(row.points)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="sd-rp-meta">
                <h4 className="sd-rp-meta-title">Last update</h4>
                <p className="sd-rp-meta-line">
                    Points last updated on {lastUpdatedStr}
                </p>
                <p className="sd-rp-meta-line">Data age: {dataAgeHours} hours</p>
                <p className="sd-rp-meta-line">Next auto-refresh in: 12.0 hours</p>
            </section>
        </div>
    );
}

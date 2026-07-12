"use client";

import { useEffect, useState } from "react";

type Summary = { total_assets: number; available_assets: number; allocated_assets: number; maintenance_assets: number; active_allocations: number };

const initialSummary: Summary = { total_assets: 248, available_assets: 156, allocated_assets: 78, maintenance_assets: 6, active_allocations: 78 };
const assets = [
  ["MacBook Pro 14\"", "AF-2024-001", "Allocated", "Engineering"],
  ["Dell UltraSharp U2723QE", "AF-2024-042", "Available", "Design"],
  ["Sony A7 IV Camera", "AF-2024-066", "Maintenance", "Marketing"],
  ["iPad Pro 12.9\"", "AF-2024-089", "Reserved", "Product"]
];

export default function Dashboard() {
  const [summary, setSummary] = useState(initialSummary);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/dashboard/summary`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data: Summary) => { setSummary(data); setConnected(true); })
      .catch(() => setConnected(false));
  }, []);

  const stats = [
    ["Total assets", summary.total_assets, "Registered across all departments"],
    ["Available", summary.available_assets, "Ready to allocate", "positive"],
    ["Allocated", summary.allocated_assets, "Currently in use", "blue"],
    ["In maintenance", summary.maintenance_assets, "Require attention", "warning"]
  ];

  return <main className="shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span>◈</span> AssetFlow</a>
      <p className="workspace">NORTHSTAR WORKSPACE</p>
      <nav>
        <a className="active" href="#dashboard">▦ <span>Dashboard</span></a>
        <a href="#assets">▣ <span>Assets</span></a>
        <a href="#allocations">⇄ <span>Allocations</span></a>
        <a href="#bookings">◷ <span>Bookings</span></a>
        <a href="#maintenance">⌁ <span>Maintenance</span></a>
        <a href="#audits">✓ <span>Audits</span></a>
      </nav>
      <div className="sidebar-bottom"><a href="#settings">⚙ <span>Settings</span></a><div className="profile"><div className="avatar">AM</div><div><strong>Alex Morgan</strong><small>Asset manager</small></div></div></div>
    </aside>
    <section className="content" id="dashboard">
      <header><div><p className="eyebrow">OVERVIEW</p><h1>Good morning, Alex</h1><p className="subtle">Here’s what’s happening with your assets today.</p></div><div className="header-actions"><span className={`connection ${connected ? "online" : ""}`}>{connected ? "API connected" : "Demo data"}</span><button className="icon-button" aria-label="Notifications">♧<i /></button><button className="primary">+ Add asset</button></div></header>
      <div className="stats">{stats.map(([title, value, detail, tone]) => <article className="stat" key={title}><p>{title}</p><strong className={tone}>{value}</strong><small>{detail}</small></article>)}</div>
      <div className="grid">
        <section className="panel asset-panel" id="assets"><div className="panel-title"><div><h2>Asset inventory</h2><p>Recently updated assets</p></div><a href="#assets">View all →</a></div><div className="table-wrap"><table><thead><tr><th>ASSET</th><th>TAG</th><th>STATUS</th><th>DEPARTMENT</th></tr></thead><tbody>{assets.map(([name, tag, status, department]) => <tr key={tag}><td><span className="asset-icon">▣</span>{name}</td><td>{tag}</td><td><span className={`status ${status.toLowerCase()}`}>{status}</span></td><td>{department}</td></tr>)}</tbody></table></div></section>
        <section className="panel action-panel"><div className="panel-title"><div><h2>Action center</h2><p>Items needing your attention</p></div></div><div className="actions"><div><span className="action-icon orange">!</span><p><strong>3 return requests</strong><small>Awaiting your review</small></p><button>Review</button></div><div><span className="action-icon violet">⌁</span><p><strong>2 maintenance tickets</strong><small>High priority</small></p><button>Open</button></div><div><span className="action-icon teal">✓</span><p><strong>Audit starts Friday</strong><small>42 assets assigned</small></p><button>View</button></div></div></section>
      </div>
      <section className="panel activity"><div className="panel-title"><div><h2>Recent activity</h2><p>A record of changes across your workspace</p></div><a href="#activity">View history →</a></div><ol><li><b>JD</b><p><strong>Jordan Davis</strong> returned <em>MacBook Pro 14”</em><small>12 minutes ago</small></p></li><li><b className="purple">SK</b><p><strong>Sam Kim</strong> created a maintenance request for <em>Sony A7 IV Camera</em><small>34 minutes ago</small></p></li><li><b className="green">AL</b><p><strong>AssetFlow</strong> scheduled the Q3 inventory audit<small>1 hour ago</small></p></li></ol></section>
    </section>
  </main>;
}

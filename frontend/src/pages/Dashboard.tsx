import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../components/primitives/Icon';
import { Segmented } from '../components/primitives/Segmented';
import { PageHeader } from '../components/primitives/PageHeader';
import { AreaChart } from '../components/charts/AreaChart';
import { BarChart } from '../components/charts/BarChart';
import { LineChart } from '../components/charts/LineChart';
import { DonutChart, HBars } from '../components/charts/DonutChart';
import { useLang, L } from '../contexts/LangContext';
import {
  KPIS, DAILY_COST, DAILY_TOKENS, LATENCY_TREND,
  PROVIDER_BREAKDOWN, MODEL_BREAKDOWN, TOP_SERVICES,
} from '../data';
import {
  getKPIs, getDailyCost, getDailyTokens, getLatencyTrend,
  getProviderBreakdown, getModelBreakdown, getTopServices,
} from '../lib/api';
import type { Kpi, ProviderBreakdown, ModelBreakdown, TopService } from '../types';

function KpiCard({ kpi, lang }: { kpi: Kpi; lang: string }) {
  const good = kpi.good != null ? kpi.good : kpi.up;
  return (
    <div className="card card-pad">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="t-label">{L(kpi, lang as 'kr' | 'en')}</span>
        <span className="badge" style={{ background: good ? 'var(--success-soft)' : 'var(--error-soft)', color: good ? 'var(--success)' : 'var(--error)' }}>
          <Icon name={kpi.up ? 'trending_up' : 'trending_down'} size={13} /> {kpi.delta}
        </span>
      </div>
      <div className="t-mono" style={{ fontSize: 30, fontWeight: 700, marginTop: 12, letterSpacing: '-0.5px' }}>{kpi.value}</div>
      <div className="t-meta" style={{ marginTop: 4 }}>{L({ kr: kpi.sub, en: kpi.subEn }, lang as 'kr' | 'en')}</div>
    </div>
  );
}

function ChartCard({ title, action, children, pad = true }: { title: string; action?: ReactNode; children: ReactNode; pad?: boolean }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px 4px' }}>
        <span style={{ fontSize: 14.5, fontWeight: 700 }}>{title}</span>
        {action}
      </div>
      <div style={{ padding: pad ? '8px 14px 16px' : 0, flex: 1 }}>{children}</div>
    </div>
  );
}

export function Dashboard() {
  const lang = useLang();
  const [range, setRange] = useState('30d');
  const [kpis, setKpis] = useState<Kpi[]>(KPIS);
  const [dailyCost, setDailyCost] = useState<number[]>(DAILY_COST);
  const [dailyTokens, setDailyTokens] = useState<number[]>(DAILY_TOKENS);
  const [latencyTrend, setLatencyTrend] = useState<number[]>(LATENCY_TREND);
  const [providerBreakdown, setProviderBreakdown] = useState<ProviderBreakdown[]>(PROVIDER_BREAKDOWN);
  const [modelBreakdown, setModelBreakdown] = useState<ModelBreakdown[]>(MODEL_BREAKDOWN);
  const [topServices, setTopServices] = useState<TopService[]>(TOP_SERVICES);

  useEffect(() => {
    getKPIs().then(r => {
      setKpis(KPIS.map(k => {
        const a = r.data.find((x: { id: string }) => x.id === k.id);
        return a ? { ...k, value: a.value, delta: a.delta, up: a.up, good: a.good ?? k.good } : k;
      }));
    }).catch(() => {});
    getProviderBreakdown().then(r => setProviderBreakdown(r.data)).catch(() => {});
    getModelBreakdown().then(r => setModelBreakdown(r.data)).catch(() => {});
    getTopServices().then(r => {
      setTopServices(r.data.map((s: { name: string; name_en: string; reqs: string; cost: string; trend: string }) => ({
        name: s.name,
        nameEn: s.name_en,
        reqs: s.reqs,
        cost: s.cost,
        trend: s.trend.startsWith('+') ? 'up' : s.trend.startsWith('-') ? 'down' : 'flat',
      })));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    getDailyCost(range).then(r => setDailyCost(r.data.values)).catch(() => {});
    getDailyTokens(range).then(r => setDailyTokens(r.data.values)).catch(() => {});
    getLatencyTrend(range).then(r => setLatencyTrend(r.data.values)).catch(() => {});
  }, [range]);

  const dayLabels = dailyCost.map((_, i) => `${i + 1}`);
  const usd = (v: number) => '$' + (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : Math.round(v));
  const tok = (v: number) => v.toFixed(0) + 'M';
  const ms = (v: number) => Math.round(v) + 'ms';

  return (
    <div className="view-in" style={{ padding: '20px 24px 40px' }}>
      <PageHeader
        title={lang === 'en' ? 'Cost & Usage' : '비용 · 사용량'}
        subtitle={lang === 'en' ? 'Track spend, tokens, and performance across the organization.' : '조직 전체의 비용, 토큰, 성능을 추적하세요.'}
        actions={
          <>
            <Segmented
              options={[{ value: '7d', label: '7D' }, { value: '30d', label: '30D' }, { value: '90d', label: '90D' }]}
              value={range}
              onChange={setRange}
            />
            <button className="btn btn-secondary">
              <Icon name="download" size={17} /> {lang === 'en' ? 'Export' : '내보내기'}
            </button>
          </>
        }
      />

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        {kpis.map(k => <KpiCard key={k.id} kpi={k} lang={lang} />)}
      </div>

      {/* daily cost + provider donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        <ChartCard
          title={lang === 'en' ? 'Daily cost' : '일별 비용'}
          action={<span className="t-meta">{lang === 'en' ? 'Last 30 days' : '최근 30일'} · <span style={{ color: 'var(--text)', fontWeight: 600 }}>$48,210</span></span>}
        >
          <AreaChart data={dailyCost} labels={dayLabels} fmt={usd} height={260} />
        </ChartCard>
        <ChartCard title={lang === 'en' ? 'By provider' : '제공사별'}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 8 }}>
            <div style={{ position: 'relative', width: 168, height: 168 }}>
              <DonutChart segments={providerBreakdown} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div className="t-mono" style={{ fontSize: 20, fontWeight: 700 }}>$48.2k</div>
                <div className="t-meta">{lang === 'en' ? 'total' : '총 비용'}</div>
              </div>
            </div>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {providerBreakdown.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: p.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: 'var(--text-sec)' }}>{L({ kr: p.name, en: p.nameEn || p.name }, lang as 'kr' | 'en')}</span>
                  <span className="t-mono" style={{ color: 'var(--muted)' }}>{p.pct}%</span>
                  <span className="t-mono" style={{ fontWeight: 600, minWidth: 56, textAlign: 'right' }}>{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* token bar + latency line */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)', marginBottom: 'var(--gap)' }}>
        <ChartCard
          title={lang === 'en' ? 'Token usage' : '토큰 사용량'}
          action={<span className="t-meta">1.84B {lang === 'en' ? 'tokens' : '토큰'}</span>}
        >
          <BarChart data={dailyTokens} labels={dayLabels} fmt={tok} height={220} />
        </ChartCard>
        <ChartCard
          title={lang === 'en' ? 'Avg latency trend' : '평균 지연시간 추이'}
          action={<span className="badge badge-success"><Icon name="trending_down" size={13} /> -6.3%</span>}
        >
          <LineChart data={latencyTrend} labels={dayLabels} fmt={ms} height={220} accent="var(--success)" />
        </ChartCard>
      </div>

      {/* model breakdown + top services */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)' }}>
        <ChartCard title={lang === 'en' ? 'Cost by model' : '모델별 비용'}>
          <div style={{ padding: '8px 4px' }}>
            <HBars rows={modelBreakdown} lang={lang} />
          </div>
        </ChartCard>
        <ChartCard title={lang === 'en' ? 'Top services' : '상위 서비스'} pad={false}>
          <table className="tbl" style={{ marginTop: 4 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 18 }}>{lang === 'en' ? 'Service' : '서비스'}</th>
                <th>{lang === 'en' ? 'Requests' : '요청'}</th>
                <th style={{ paddingRight: 18, textAlign: 'right' }}>{lang === 'en' ? 'Cost' : '비용'}</th>
              </tr>
            </thead>
            <tbody>
              {topServices.map((s, i) => (
                <tr key={i}>
                  <td style={{ paddingLeft: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="t-mono" style={{ color: 'var(--muted)', fontSize: 12, width: 16 }}>{i + 1}</span>
                      <span style={{ fontWeight: 600 }}>{L({ kr: s.name, en: s.nameEn }, lang as 'kr' | 'en')}</span>
                    </div>
                  </td>
                  <td className="t-mono" style={{ color: 'var(--text-sec)' }}>{s.reqs}</td>
                  <td className="t-mono" style={{ paddingRight: 18, textAlign: 'right', fontWeight: 600 }}>
                    {s.cost}
                    <Icon
                      name={s.trend === 'up' ? 'arrow_drop_up' : s.trend === 'down' ? 'arrow_drop_down' : 'remove'}
                      size={18}
                      style={{
                        verticalAlign: '-5px',
                        color: s.trend === 'up' ? 'var(--error)' : s.trend === 'down' ? 'var(--success)' : 'var(--muted)',
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ChartCard>
      </div>
    </div>
  );
}

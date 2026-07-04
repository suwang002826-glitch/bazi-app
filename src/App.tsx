import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ClipboardCheck,
  GitBranch,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { calculateBazi, type BaziInput, type BaziResult } from './lib/bazi'
import './App.css'

interface SavedRecord {
  id: string
  input: BaziInput
  result: BaziResult
  savedAt: string
}

const today = new Date()
const defaultInput: BaziInput = {
  name: '测试命盘',
  gender: 'female',
  calendarType: 'solar',
  birthDate: `${today.getFullYear()}-01-01`,
  birthTime: '09:00',
  birthPlace: '北京',
  isLeapMonth: false,
  longitude: '120.0',
  latitude: '39.0',
  useDst: false,
  useTrueSolarTime: false,
}

const storageKey = 'bazi-app-records'

const loadRecords = (): SavedRecord[] => {
  try {
    const raw = window.localStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as SavedRecord[]) : []
  } catch {
    return []
  }
}

function App() {
  const [form, setForm] = useState<BaziInput>(defaultInput)
  const [records, setRecords] = useState<SavedRecord[]>(loadRecords)
  const [message, setMessage] = useState('项目骨架已就绪')

  const result = useMemo(() => {
    try {
      return { value: calculateBazi(form), error: '' }
    } catch (error) {
      return {
        value: null,
        error: error instanceof Error ? error.message : '排盘失败，请检查输入。',
      }
    }
  }, [form])

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(records))
  }, [records])

  const updateForm = <Key extends keyof BaziInput>(
    key: Key,
    value: BaziInput[Key],
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      isLeapMonth: key === 'calendarType' && value === 'solar' ? false : current.isLeapMonth,
    }))
  }

  const saveRecord = () => {
    if (!result.value) {
      setMessage(result.error)
      return
    }

    const nextRecord: SavedRecord = {
      id: crypto.randomUUID(),
      input: form,
      result: result.value,
      savedAt: new Date().toLocaleString('zh-CN'),
    }

    setRecords((current) => [nextRecord, ...current].slice(0, 12))
    setMessage('命盘已保存到本机')
  }

  const resetForm = () => {
    setForm(defaultInput)
    setMessage('已恢复示例输入')
  }

  const loadRecord = (record: SavedRecord) => {
    setForm(record.input)
    setMessage('已载入保存记录')
  }

  const deleteRecord = (recordId: string) => {
    setRecords((current) => current.filter((record) => record.id !== recordId))
    setMessage('保存记录已删除')
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            八
          </div>
          <div>
            <h1>八字排盘</h1>
            <p>中文协作版起步项目</p>
          </div>
        </div>
        <div className="workflow-strip" aria-label="协作流程">
          <span>
            <ClipboardCheck size={16} aria-hidden="true" />
            任务
          </span>
          <span>
            <GitBranch size={16} aria-hidden="true" />
            分支
          </span>
          <span>
            <Sparkles size={16} aria-hidden="true" />
            验收
          </span>
        </div>
      </header>

      <section className="workspace">
        <form className="input-panel" onSubmit={(event) => event.preventDefault()}>
          <div className="section-heading">
            <CalendarDays size={20} aria-hidden="true" />
            <h2>出生信息</h2>
          </div>

          <label>
            姓名
            <input
              value={form.name}
              onChange={(event) => updateForm('name', event.target.value)}
              placeholder="请输入姓名"
            />
          </label>

          <div className="field-row">
            <label>
              性别
              <select
                value={form.gender}
                onChange={(event) =>
                  updateForm('gender', event.target.value as BaziInput['gender'])
                }
              >
                <option value="female">女</option>
                <option value="male">男</option>
              </select>
            </label>

            <label>
              历法
              <select
                value={form.calendarType}
                onChange={(event) =>
                  updateForm(
                    'calendarType',
                    event.target.value as BaziInput['calendarType'],
                  )
                }
              >
                <option value="solar">公历</option>
                <option value="lunar">农历</option>
              </select>
            </label>
          </div>

          <div className="field-row">
            <label>
              出生日期
              <input
                type="date"
                value={form.birthDate}
                onChange={(event) => updateForm('birthDate', event.target.value)}
              />
            </label>

            <label>
              出生时间
              <input
                type="time"
                value={form.birthTime}
                onChange={(event) => updateForm('birthTime', event.target.value)}
              />
            </label>
          </div>

          {form.calendarType === 'lunar' && (
            <label className="check-row">
              <input
                type="checkbox"
                checked={form.isLeapMonth}
                onChange={(event) => updateForm('isLeapMonth', event.target.checked)}
              />
              闰月
            </label>
          )}

          <label>
            出生地
            <input
              value={form.birthPlace}
              onChange={(event) => updateForm('birthPlace', event.target.value)}
              placeholder="请输入城市"
            />
          </label>

          <div className="field-row">
            <label>
              经度
              <input
                type="number"
                step="0.1"
                value={form.longitude}
                onChange={(event) => updateForm('longitude', event.target.value)}
              />
            </label>

            <label>
              纬度
              <input
                type="number"
                step="0.1"
                value={form.latitude}
                onChange={(event) => updateForm('latitude', event.target.value)}
              />
            </label>
          </div>

          <label className="check-row">
            <input
              type="checkbox"
              checked={form.useTrueSolarTime}
              onChange={(event) => updateForm('useTrueSolarTime', event.target.checked)}
            />
            真太阳时
          </label>

          <label className="check-row">
            <input
              type="checkbox"
              checked={form.useDst}
              onChange={(event) => updateForm('useDst', event.target.checked)}
            />
            夏令时
          </label>

          <div className="button-row">
            <button type="button" className="primary-button" onClick={saveRecord}>
              <Save size={18} aria-hidden="true" />
              保存命盘
            </button>
            <button type="button" className="ghost-button" onClick={resetForm}>
              <RotateCcw size={18} aria-hidden="true" />
              重置
            </button>
          </div>

          <p className="status-text" role="status">
            {message}
          </p>
        </form>

        <section className="result-panel" aria-live="polite">
          {result.value ? (
            <>
              <div className="chart-summary">
                <div className="plate-mark-large" aria-hidden="true">
                  <span>年</span>
                  <span>月</span>
                  <span>日</span>
                  <span>时</span>
                </div>
                <div>
                  <p className="eyebrow">{result.value.displayName}</p>
                  <h2>{result.value.pillars.map((pillar) => pillar.pillar).join(' ')}</h2>
                  <dl className="meta-grid">
                    <div>
                      <dt>性别</dt>
                      <dd>{result.value.genderText}</dd>
                    </div>
                    <div>
                      <dt>生肖</dt>
                      <dd>{result.value.zodiac}</dd>
                    </div>
                    <div>
                      <dt>公历</dt>
                      <dd>{result.value.solarText}</dd>
                    </div>
                    <div>
                      <dt>农历</dt>
                      <dd>{result.value.lunarText}</dd>
                    </div>
                    <div>
                      <dt>节气</dt>
                      <dd>{result.value.jieQi}</dd>
                    </div>
                    <div>
                      <dt>出生地</dt>
                      <dd>{form.birthPlace || '未填写'}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="pillar-grid">
                {result.value.pillars.map((pillar) => (
                  <article className="pillar-card" key={pillar.label}>
                    <p>{pillar.label}</p>
                    <h3>{pillar.pillar}</h3>
                    <dl>
                      <div>
                        <dt>天干</dt>
                        <dd>{pillar.gan}</dd>
                      </div>
                      <div>
                        <dt>地支</dt>
                        <dd>{pillar.zhi}</dd>
                      </div>
                      <div>
                        <dt>藏干</dt>
                        <dd>{pillar.hiddenStems}</dd>
                      </div>
                      <div>
                        <dt>五行</dt>
                        <dd>{pillar.wuxing}</dd>
                      </div>
                      <div>
                        <dt>十神</dt>
                        <dd>
                          {pillar.shishenGan}；{pillar.shishenZhi}
                        </dd>
                      </div>
                      <div>
                        <dt>纳音</dt>
                        <dd>{pillar.nayin}</dd>
                      </div>
                      <div>
                        <dt>旬空</dt>
                        <dd>{pillar.xunkong}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>

              <div className="auxiliary-row">
                <span>胎元：{result.value.taiYuan}</span>
                <span>命宫：{result.value.mingGong}</span>
                <span>身宫：{result.value.shenGong}</span>
              </div>

              <ul className="note-list">
                {result.value.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </>
          ) : (
            <div className="empty-result">
              <h2>请检查输入</h2>
              <p>{result.error}</p>
            </div>
          )}
        </section>
      </section>

      <section className="records-panel">
        <div className="section-heading">
          <Save size={20} aria-hidden="true" />
          <h2>保存记录</h2>
        </div>
        {records.length === 0 ? (
          <p className="empty-copy">暂无保存记录</p>
        ) : (
          <div className="record-list">
            {records.map((record) => (
              <article className="record-card" key={record.id}>
                <button type="button" onClick={() => loadRecord(record)}>
                  <strong>{record.result.displayName}</strong>
                  <span>{record.result.pillars.map((pillar) => pillar.pillar).join(' ')}</span>
                  <small>{record.savedAt}</small>
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`删除${record.result.displayName}`}
                  onClick={() => deleteRecord(record.id)}
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default App

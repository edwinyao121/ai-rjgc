import { useState } from 'react'
import { AppSimulator } from './KanbanBoard'
import { 
  Play, Compass, Wind, AlertTriangle, MapPin, 
  Search, Grid, LayoutGrid, Layers, Cpu, CheckCircle, 
  ArrowRight, ShieldCheck, Heart, Sparkles, Filter 
} from 'lucide-react'

// App data containing metadata, description, and domain configs
const apps = [
  {
    id: 1,
    title: '航母母港潮汐窗口计算器',
    domain: '海洋域',
    version: 'v1.0.4',
    uptime: '15天',
    description: '实时监控全球四大航母母港潮汐水位，基于 12.8 米吃水阈值自动解算可出港安全时间窗口并提供精准倒计时。',
    icon: Compass,
    iconBg: 'from-blue-500 to-indigo-600',
    tags: ['潮汐数据', '吃水计算', '出港窗口'],
    health: '100%'
  },
  {
    id: 2,
    title: '甲板风实时计算器',
    domain: '航空域',
    version: 'v2.1.0',
    uptime: '12天',
    description: '集成全球海域风场数据，叠加航母自身航速与航向，精确计算甲板合成风速及偏角，智能评估舰载机安全起降状态。',
    icon: Wind,
    iconBg: 'from-sky-400 to-blue-500',
    tags: ['合成风', '向量计算', '飞行安全'],
    health: '100%'
  },
  {
    id: 3,
    title: '海域网格商船密度异常告警器',
    domain: '监控域',
    version: 'v1.1.2',
    uptime: '8天',
    description: '接入海量 AIS 船舶动态，对特定防区执行 50 海里精度的网格化密度统计，自动识别并对偏离常态均值的海域进行红黄双级预警。',
    icon: AlertTriangle,
    iconBg: 'from-amber-500 to-orange-600',
    tags: ['AIS数据', '密度分析', '网格告警'],
    health: '100%'
  },
  {
    id: 4,
    title: '开源社区异常监测',
    domain: '情报域',
    version: 'v0.9.8',
    uptime: '3天',
    description: '监测主流社交网络公开内容，自动提取地理位置实体与 EXIF 图像元数据，对热点事件和目击记录进行地理空间聚类分析与散点热力呈现。',
    icon: MapPin,
    iconBg: 'from-purple-500 to-pink-600',
    tags: ['OSINT', '聚类分析', '坐标提取'],
    health: '100%'
  }
]

export default function AppStore() {
  const [activeAppId, setActiveAppId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDomain, setSelectedDomain] = useState('All')

  // Filter apps based on search query and domain filter
  const filteredApps = apps.filter(app => {
    const matchesSearch = app.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesDomain = selectedDomain === 'All' || app.domain === selectedDomain
    return matchesSearch && matchesDomain
  })

  const domains = ['All', '海洋域', '航空域', '监控域', '情报域']

  if (activeAppId !== null) {
    return (
      <AppSimulator 
        appId={activeAppId} 
        onClose={() => setActiveAppId(null)} 
        closeLabel="返回应用商店" 
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header section with Page Title and Description */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">应用商店</h1>
          <p className="text-gray-500 text-sm mt-1">已编译、质检并通过流水线成功部署上架的智能服务列表</p>
        </div>
      </div>

      {/* Stats Cards Dashboard */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-semibold">上架应用总数</span>
            <span className="text-2xl font-bold text-gray-800">{apps.length} 款</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-semibold">运行中状态</span>
            <span className="text-2xl font-bold text-green-600">{apps.length} / {apps.length} 运行中</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-semibold">AI 赋能比例</span>
            <span className="text-2xl font-bold text-purple-600">100 %</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <Heart className="w-6 h-6 text-emerald-500 animate-pulse" />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-semibold">系统平均健康度</span>
            <span className="text-2xl font-bold text-emerald-600">100.0%</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Container */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>分类筛选:</span>
          </div>
          {domains.map(domain => (
            <button
              key={domain}
              onClick={() => setSelectedDomain(domain)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                selectedDomain === domain
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {domain === 'All' ? '全部' : domain}
            </button>
          ))}
        </div>

        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索上架应用、描述或标签..."
            className="w-full text-xs border border-gray-300 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800"
          />
        </div>
      </div>

      {/* Applications Grid */}
      <div className="grid grid-cols-2 gap-6">
        {filteredApps.map(app => {
          const Icon = app.icon
          return (
            <div 
              key={app.id} 
              className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div>
                {/* App Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${app.iconBg} flex items-center justify-center text-white shadow-sm`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-bold text-gray-800 text-base group-hover:text-blue-600 transition-colors">{app.title}</h2>
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-mono font-medium">{app.version}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{app.domain} · 已稳定运行 {app.uptime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] text-emerald-600 font-semibold">就绪</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-650 leading-relaxed min-h-12 mb-4">
                  {app.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {app.tags.map((tag, i) => (
                    <span 
                      key={i} 
                      className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Area */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="text-[10px] text-gray-400">
                  健康度: <span className="text-emerald-500 font-bold">{app.health}</span>
                </div>
                <button
                  onClick={() => setActiveAppId(app.id)}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all hover:scale-105 group-hover:translate-x-0.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  启动应用
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </div>
          )
        })}

        {filteredApps.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-gray-200">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-500">没有找到匹配的应用</p>
            <p className="text-xs text-gray-400 mt-1">请尝试更换检索关键词或分类筛选条件</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Shield, Plus, Search, Settings, ChevronRight, CheckCircle, XCircle, AlertTriangle, ToggleLeft, ToggleRight, Copy, Trash2, Edit } from 'lucide-react'

const ruleCategories = [
  { id: 'requirement', name: '需求规则', count: 5, color: 'indigo' },
  { id: 'design', name: '设计规则', count: 4, color: 'blue' },
  { id: 'code', name: '代码规则', count: 8, color: 'purple' },
  { id: 'test', name: '测试规则', count: 6, color: 'amber' },
  { id: 'deploy', name: '部署规则', count: 3, color: 'emerald' }
]

const rules = [
  { id: 1, name: '需求描述完整性校验', category: 'requirement', stage: '需求待入厂', priority: 'high', status: true, passRate: 95, failReason: '需求描述不完整', description: '校验需求描述是否包含业务背景、用户故事、验收标准' },
  { id: 2, name: '业务边界清晰度检查', category: 'requirement', stage: '需求待入厂', priority: 'high', status: true, passRate: 88, failReason: '业务边界模糊', description: '检查业务边界是否清晰定义' },
  { id: 3, name: '架构设计方案完整性', category: 'design', stage: '系统设计中', priority: 'high', status: true, passRate: 92, failReason: '架构设计缺失', description: '校验是否输出架构图、模块设计、接口定义' },
  { id: 4, name: '代码编译通过率', category: 'code', stage: '代码开发中', priority: 'critical', status: true, passRate: 90, failReason: '编译失败', description: '代码必须通过编译检查，无语法错误' },
  { id: 5, name: '代码规范合规检查', category: 'code', stage: '代码开发中', priority: 'medium', status: true, passRate: 85, failReason: '规范违规', description: '检查代码是否符合项目编码规范' },
  { id: 6, name: '单元测试覆盖率', category: 'test', stage: '测试质检中', priority: 'high', status: true, passRate: 78, failReason: '覆盖率不足', description: '单元测试覆盖率需达到 80% 以上' },
  { id: 7, name: '高危漏洞扫描', category: 'test', stage: '测试质检中', priority: 'critical', status: true, passRate: 98, failReason: '存在高危漏洞', description: '安全漏洞扫描，高危漏洞必须为 0' },
  { id: 8, name: 'Docker镜像构建', category: 'deploy', stage: '部署交付', priority: 'high', status: true, passRate: 100, failReason: '构建失败', description: 'Docker镜像必须构建成功' },
  { id: 9, name: '服务健康检查', category: 'deploy', stage: '部署交付', priority: 'critical', status: true, passRate: 95, failReason: '健康检查失败', description: '部署后服务必须通过健康检查' },
  { id: 10, name: 'API接口文档完整性', category: 'design', stage: '系统设计中', priority: 'medium', status: false, passRate: 0, failReason: '文档缺失', description: '所有API接口必须有完整文档' }
]

const templates = [
  { id: 1, name: 'Web系统生产线模板', description: '适用于标准Web系统开发', stages: ['需求入厂', '系统设计', '代码开发', '测试质检', '部署交付'], rules: 15 },
  { id: 2, name: '微服务生产线模板', description: '适用于微服务架构项目', stages: ['需求入厂', '架构设计', '服务开发', '集成测试', '部署交付'], rules: 18 },
  { id: 3, name: '小程序生产线模板', description: '适用于微信/支付宝小程序', stages: ['需求入厂', 'UI设计', '功能开发', '测试质检', '审核交付'], rules: 12 }
]

const priorityColors = { critical: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-gray-100 text-gray-700' }
const stageColors = { '需求待入厂': 'bg-slate-100 text-slate-700', '系统设计中': 'bg-indigo-100 text-indigo-700', '代码开发中': 'bg-purple-100 text-purple-700', '测试质检中': 'bg-amber-100 text-amber-700', '部署交付': 'bg-emerald-100 text-emerald-700' }

function RuleCard({ rule, onToggle, onEdit }) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${rule.status ? 'bg-green-100' : 'bg-gray-100'}`}>
            {rule.status ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-gray-400" />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{rule.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{rule.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(rule.id)}
            className={`p-1 rounded transition-colors ${rule.status ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
          >
            {rule.status ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
          </button>
          <button onClick={() => onEdit(rule)} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
            <Edit className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${stageColors[rule.stage]}`}>{rule.stage}</span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[rule.priority]}`}>
          {rule.priority === 'critical' ? '紧急' : rule.priority === 'high' ? '高' : rule.priority === 'medium' ? '中' : '低'}
        </span>
        <span className="text-gray-500 ml-auto">通过率: <span className="font-medium text-gray-700">{rule.passRate}%</span></span>
      </div>
    </div>
  )
}

function RuleEngine() {
  const [rulesData, setRulesData] = useState(rules)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredRules = rulesData.filter(rule => {
    const matchesCategory = selectedCategory === 'all' || rule.category === selectedCategory
    const matchesSearch = rule.name.includes(searchTerm) || rule.description.includes(searchTerm)
    return matchesCategory && matchesSearch
  })

  const handleToggleRule = (id) => {
    setRulesData(rulesData.map(rule =>
      rule.id === id ? { ...rule, status: !rule.status } : rule
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">规则引擎</h1>
          <p className="text-gray-500 text-sm mt-1">配置和管理质量门禁规则、准入准出条件</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className={`px-4 py-2 rounded-lg transition-colors ${showTemplates ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            规则模板
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建规则
          </button>
        </div>
      </div>

      {showTemplates && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">生产线模板</h2>
          <div className="grid grid-cols-3 gap-4">
            {templates.map(template => (
              <div key={template.id} className="border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer">
                <h3 className="font-semibold text-gray-800 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                <div className="flex items-center gap-2 mb-3">
                  {template.stages.map((stage, index) => (
                    <span key={index} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">{stage}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{template.rules} 条规则</span>
                  <button className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                    <Copy className="w-3 h-3" />
                    应用模板
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            全部规则 ({rules.length})
          </button>
          {ruleCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredRules.map(rule => (
          <RuleCard key={rule.id} rule={rule} onToggle={handleToggleRule} onEdit={() => {}} />
        ))}
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-4">门禁拦截统计</h2>
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-gray-800">326</p>
            <p className="text-xs text-gray-500 mt-1">本周执行</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-green-600">289</p>
            <p className="text-xs text-green-600 mt-1">通过</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-red-600">37</p>
            <p className="text-xs text-red-600 mt-1">拦截</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">89%</p>
            <p className="text-xs text-amber-600 mt-1">通过率</p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-4 text-center">
            <p className="text-3xl font-bold text-indigo-600">26</p>
            <p className="text-xs text-indigo-600 mt-1">自动修复</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-3">拦截原因分布</h3>
          <div className="grid grid-cols-5 gap-3">
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-xs text-gray-500">需求不完整</p>
                <p className="font-medium text-gray-800">12</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-xs text-gray-500">编译失败</p>
                <p className="font-medium text-gray-800">8</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-xs text-gray-500">覆盖率不足</p>
                <p className="font-medium text-gray-800">10</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-xs text-gray-500">高危漏洞</p>
                <p className="font-medium text-gray-800">4</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <div>
                <p className="text-xs text-gray-500">其他</p>
                <p className="font-medium text-gray-800">3</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RuleEngine
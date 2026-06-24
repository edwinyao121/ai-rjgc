import { useState } from 'react'
import { Network, CheckCircle, Circle, Loader, Clock, ArrowRight, ZoomIn, ZoomOut, Maximize2, GitBranch, FileCode, FlaskConical, Rocket, Package } from 'lucide-react'

const pipelineNodes = [
  { id: 1, name: '需求入厂', icon: Package, status: 'completed', count: 12, avgTime: '5分钟', agents: ['需求设计 Agent'] },
  { id: 2, name: '系统设计', icon: GitBranch, status: 'completed', count: 10, avgTime: '25分钟', agents: ['需求设计 Agent'] },
  { id: 3, name: '代码开发', icon: FileCode, status: 'active', count: 8, avgTime: '45分钟', agents: ['代码生成 Agent'] },
  { id: 4, name: '测试质检', icon: FlaskConical, status: 'pending', count: 4, avgTime: '30分钟', agents: ['测试质量 Agent'] },
  { id: 5, name: '部署交付', icon: Rocket, status: 'pending', count: 2, avgTime: '15分钟', agents: ['部署交付 Agent'] }
]

const taskDetails = [
  { id: 'WO-2024-001', name: '电商订单系统', currentStage: 3, stages: [
    { stage: '需求入厂', status: 'completed', time: '10:00', duration: '5分钟' },
    { stage: '系统设计', status: 'completed', time: '10:05', duration: '25分钟' },
    { stage: '代码开发', status: 'active', time: '10:30', duration: '进行中' },
    { stage: '测试质检', status: 'pending', time: '-', duration: '-' },
    { stage: '部署交付', status: 'pending', time: '-', duration: '-' }
  ]},
  { id: 'WO-2024-002', name: '用户认证中心', currentStage: 4, stages: [
    { stage: '需求入厂', status: 'completed', time: '09:30', duration: '5分钟' },
    { stage: '系统设计', status: 'completed', time: '09:35', duration: '20分钟' },
    { stage: '代码开发', status: 'completed', time: '09:55', duration: '40分钟' },
    { stage: '测试质检', status: 'active', time: '10:35', duration: '进行中' },
    { stage: '部署交付', status: 'pending', time: '-', duration: '-' }
  ]},
  { id: 'WO-2024-003', name: '支付结算系统', currentStage: 5, stages: [
    { stage: '需求入厂', status: 'completed', time: '09:00', duration: '5分钟' },
    { stage: '系统设计', status: 'completed', time: '09:05', duration: '22分钟' },
    { stage: '代码开发', status: 'completed', time: '09:27', duration: '38分钟' },
    { stage: '测试质检', status: 'completed', time: '10:05', duration: '28分钟' },
    { stage: '部署交付', status: 'completed', time: '10:33', duration: '12分钟' }
  ]}
]

const dependencyGraph = {
  nodes: [
    { id: 'req', name: '需求文档', type: 'document', x: 50, y: 50 },
    { id: 'design', name: '架构设计', type: 'design', x: 200, y: 50 },
    { id: 'api', name: 'API定义', type: 'design', x: 200, y: 150 },
    { id: 'backend', name: '后端代码', type: 'code', x: 400, y: 50 },
    { id: 'frontend', name: '前端代码', type: 'code', x: 400, y: 150 },
    { id: 'db', name: '数据库', type: 'code', x: 400, y: 250 },
    { id: 'tests', name: '测试用例', type: 'test', x: 600, y: 100 },
    { id: 'deploy', name: '部署包', type: 'deploy', x: 800, y: 100 }
  ],
  links: [
    { source: 'req', target: 'design' },
    { source: 'req', target: 'api' },
    { source: 'design', target: 'backend' },
    { source: 'api', target: 'backend' },
    { source: 'api', target: 'frontend' },
    { source: 'design', target: 'db' },
    { source: 'backend', target: 'tests' },
    { source: 'frontend', target: 'tests' },
    { source: 'tests', target: 'deploy' },
    { source: 'backend', target: 'deploy' }
  ]
}

const typeColors = {
  document: { bg: 'bg-slate-100', border: 'border-slate-400', text: 'text-slate-700', icon: Package },
  design: { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-700', icon: GitBranch },
  code: { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700', icon: FileCode },
  test: { bg: 'bg-amber-100', border: 'border-amber-400', text: 'text-amber-700', icon: FlaskConical },
  deploy: { bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-700', icon: Rocket }
}

function PipelineNode({ node, isActive }) {
  const Icon = node.icon
  return (
    <div className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
      node.status === 'completed' ? 'bg-emerald-50 border-emerald-400' :
      node.status === 'active' ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200' :
      'bg-gray-50 border-gray-300'
    }`}>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
        node.status === 'completed' ? 'bg-emerald-500' :
        node.status === 'active' ? 'bg-blue-500 animate-pulse' :
        'bg-gray-400'
      }`}>
        {node.status === 'completed' ? (
          <CheckCircle className="w-6 h-6 text-white" />
        ) : node.status === 'active' ? (
          <Loader className="w-6 h-6 text-white animate-spin" />
        ) : (
          <Circle className="w-6 h-6 text-white" />
        )}
      </div>
      <p className={`mt-2 font-semibold text-sm ${node.status === 'completed' ? 'text-emerald-700' : node.status === 'active' ? 'text-blue-700' : 'text-gray-500'}`}>
        {node.name}
      </p>
      <p className="text-xs text-gray-500">{node.count} 个工单</p>
    </div>
  )
}

function EngineeringView() {
  const [selectedTask, setSelectedTask] = useState(null)
  const [viewMode, setViewMode] = useState('pipeline')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">工程链路可视化</h1>
          <p className="text-gray-500 text-sm mt-1">展示需求→设计→代码→测试→部署的完整工程链路</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'pipeline' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              流水线视图
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'timeline' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              时间轴视图
            </button>
            <button
              onClick={() => setViewMode('dependency')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === 'dependency' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              依赖链路图
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <ZoomOut className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <ZoomIn className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Maximize2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'pipeline' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-800">软件生产线</h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span> 已完成
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span> 进行中
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-gray-400"></span> 等待中
              </span>
            </div>
          </div>

          <div className="flex items-start justify-between">
            {pipelineNodes.map((node, index) => (
              <div key={node.id} className="flex items-center">
                <PipelineNode node={node} />
                {index < pipelineNodes.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 mt-[-40px] ${
                    pipelineNodes[index + 1].status !== 'pending' ? 'bg-emerald-400' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="grid grid-cols-5 gap-4">
              {pipelineNodes.map(node => (
                <div key={node.id} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <node.icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{node.name}</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>平均耗时: {node.avgTime}</p>
                    <p>执行Agent: {node.agents[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'timeline' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">工单全生命周期时间轴</h2>
            <div className="space-y-4">
              {taskDetails.map(task => (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                  className={`p-4 border rounded-xl cursor-pointer transition-all ${
                    selectedTask?.id === task.id ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm text-gray-600">{task.id}</span>
                      <span className="font-semibold text-gray-800">{task.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">当前阶段: 第 {task.currentStage} 步 / 5</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.stages.map((stage, index) => (
                      <div key={index} className="flex items-center">
                        <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                          stage.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          stage.status === 'active' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {stage.stage}
                        </div>
                        {index < task.stages.length - 1 && (
                          <ArrowRight className="w-4 h-4 text-gray-300 mx-1" />
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedTask?.id === task.id && (
                    <div className="mt-4 pt-4 border-t border-indigo-200">
                      <div className="grid grid-cols-5 gap-2">
                        {task.stages.map((stage, index) => (
                          <div key={index} className="text-center">
                            <p className="text-xs text-gray-500">{stage.time}</p>
                            <p className={`text-sm font-medium ${stage.status === 'completed' ? 'text-emerald-600' : stage.status === 'active' ? 'text-blue-600' : 'text-gray-400'}`}>
                              {stage.duration}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'dependency' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">工程依赖链路图</h2>
          <div className="relative h-96 border border-gray-200 rounded-xl overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 900 350">
              {dependencyGraph.links.map((link, index) => {
                const source = dependencyGraph.nodes.find(n => n.id === link.source)
                const target = dependencyGraph.nodes.find(n => n.id === link.target)
                return (
                  <line
                    key={index}
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="#d1d5db"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                )
              })}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#d1d5db" />
                </marker>
              </defs>
              {dependencyGraph.nodes.map(node => {
                const colors = typeColors[node.type]
                const Icon = colors.icon
                return (
                  <g key={node.id} transform={`translate(${node.x - 40}, ${node.y - 20})`}>
                    <rect
                      width="80"
                      height="40"
                      rx="8"
                      className={`${colors.bg} ${colors.border}`}
                      strokeWidth="2"
                    />
                    <Icon className={`w-5 h-5 ${colors.text} mx-auto mt-2`} />
                    <text
                      x="40"
                      y="35"
                      textAnchor="middle"
                      className={`text-xs ${colors.text}`}
                      fill="currentColor"
                    >
                      {node.name}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            {Object.entries(typeColors).map(([type, colors]) => {
              const Icon = colors.icon
              return (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${colors.bg} border ${colors.border}`}></div>
                  <span className="text-xs text-gray-600 capitalize">{type}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">链路统计</h2>
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-800">26</p>
              <p className="text-xs text-gray-500">总工单</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">12</p>
              <p className="text-xs text-emerald-600">已完成</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">8</p>
              <p className="text-xs text-blue-600">进行中</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">6</p>
              <p className="text-xs text-amber-600">等待中</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-800 mb-4">平均耗时</h2>
          <div className="flex items-end justify-between h-24">
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 bg-slate-200 rounded-t" style={{ height: '8px' }}></div>
              <span className="text-xs text-gray-500">5m</span>
              <span className="text-xs text-gray-600">需求</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 bg-indigo-300 rounded-t" style={{ height: '35px' }}></div>
              <span className="text-xs text-gray-500">25m</span>
              <span className="text-xs text-gray-600">设计</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 bg-purple-300 rounded-t" style={{ height: '60px' }}></div>
              <span className="text-xs text-gray-500">45m</span>
              <span className="text-xs text-gray-600">开发</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 bg-amber-300 rounded-t" style={{ height: '40px' }}></div>
              <span className="text-xs text-gray-500">30m</span>
              <span className="text-xs text-gray-600">测试</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 bg-emerald-300 rounded-t" style={{ height: '20px' }}></div>
              <span className="text-xs text-gray-500">15m</span>
              <span className="text-xs text-gray-600">部署</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EngineeringView
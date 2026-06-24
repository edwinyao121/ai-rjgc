import { useState } from 'react'
import { Settings, User, Bell, Shield, Palette, Database, Key, Globe, Save, ChevronRight } from 'lucide-react'

const tabs = [
  { id: 'general', name: '通用设置', icon: Settings },
  { id: 'user', name: '用户管理', icon: User },
  { id: 'notification', name: '通知设置', icon: Bell },
  { id: 'security', name: '安全设置', icon: Shield },
  { id: 'appearance', name: '外观设置', icon: Palette }
]

const users = [
  { id: 1, name: 'Admin', email: 'admin@factory.com', role: '超级管理员', status: 'active', lastLogin: '2024-01-15 10:30' },
  { id: 2, name: '张三', email: 'zhangsan@factory.com', role: '开发工程师', status: 'active', lastLogin: '2024-01-15 09:15' },
  { id: 3, name: '李四', email: 'lisi@factory.com', role: '测试工程师', status: 'active', lastLogin: '2024-01-14 18:20' },
  { id: 4, name: '王五', email: 'wangwu@factory.com', role: '项目经理', status: 'inactive', lastLogin: '2024-01-10 14:00' }
]

const notifications = [
  { id: 1, name: '工单完成通知', description: '工单完成部署后发送通知', enabled: true, channels: ['邮件', '站内信'] },
  { id: 2, name: '门禁拦截通知', description: '工单被门禁拦截时发送通知', enabled: true, channels: ['邮件', '站内信', '短信'] },
  { id: 3, name: 'Agent异常通知', description: 'Agent运行异常时发送通知', enabled: true, channels: ['邮件'] },
  { id: 4, name: '每日生产报告', description: '每日发送工厂生产统计报告', enabled: false, channels: ['邮件'] },
  { id: 5, name: '工单超时提醒', description: '工单超过预期时间未完成时提醒', enabled: true, channels: ['站内信'] }
]

function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [settings, setSettings] = useState({
    factoryName: '智能软件工厂',
    factoryCode: 'SF-001',
    timezone: 'Asia/Shanghai',
    language: 'zh-CN',
    autoRefresh: true,
    refreshInterval: 30
  })

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[48px] font-bold text-gray-800">系统设置</h1>
          <p className="text-gray-500 text-[28px] mt-1">配置和管理智能软件工厂的各项设置</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex">
          <div className="w-64 border-r border-gray-200 p-8">
            <nav className="space-y-2">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-6 px-8 py-6 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-10 h-10" />
                    <span className="font-medium">{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="flex-1 p-12">
            {activeTab === 'general' && (
              <div className="space-y-12">
                <div>
                  <h2 className="text-[36px] font-semibold text-gray-800 mb-4">通用设置</h2>
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-12">
                      <div>
                        <label className="block text-[28px] font-medium text-gray-700 mb-2">工厂名称</label>
                        <input
                          type="text"
                          value={settings.factoryName}
                          onChange={(e) => setSettings({ ...settings, factoryName: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-8 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[28px] font-medium text-gray-700 mb-2">工厂编号</label>
                        <input
                          type="text"
                          value={settings.factoryCode}
                          onChange={(e) => setSettings({ ...settings, factoryCode: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-8 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-12">
                      <div>
                        <label className="block text-[28px] font-medium text-gray-700 mb-2">时区</label>
                        <select
                          value={settings.timezone}
                          onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-8 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
                          <option value="America/New_York">America/New_York (UTC-5)</option>
                          <option value="Europe/London">Europe/London (UTC+0)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[28px] font-medium text-gray-700 mb-2">语言</label>
                        <select
                          value={settings.language}
                          onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                          className="w-full border border-gray-300 rounded-lg px-8 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="zh-CN">简体中文</option>
                          <option value="en-US">English</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-8 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-700">自动刷新数据</p>
                        <p className="text-[28px] text-gray-500">自动刷新看板和监控数据</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <select
                          value={settings.refreshInterval}
                          onChange={(e) => setSettings({ ...settings, refreshInterval: Number(e.target.value) })}
                          className="border border-gray-300 rounded-lg px-6 py-2 text-[28px] focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          disabled={!settings.autoRefresh}
                        >
                          <option value={10}>10秒</option>
                          <option value={30}>30秒</option>
                          <option value={60}>60秒</option>
                        </select>
                        <button
                          onClick={() => setSettings({ ...settings, autoRefresh: !settings.autoRefresh })}
                          className={`w-12 h-12 rounded-full relative transition-colors ${
                            settings.autoRefresh ? 'bg-indigo-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-10 h-10 bg-white rounded-full absolute top-0.5 transition-all ${
                            settings.autoRefresh ? 'right-0.5' : 'left-0.5'
                          }`}></div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-8 border-t border-gray-100">
                  <button className="flex items-center gap-4 px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    <Save className="w-8 h-8" />
                    保存设置
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'user' && (
              <div className="space-y-12">
                <div className="flex items-center justify-between">
                  <h2 className="text-[36px] font-semibold text-gray-800">用户管理</h2>
                  <button className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-[28px]">
                    添加用户
                  </button>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-8 py-6 text-left text-[28px] font-medium text-gray-600">用户</th>
                        <th className="px-8 py-6 text-left text-[28px] font-medium text-gray-600">角色</th>
                        <th className="px-8 py-6 text-left text-[28px] font-medium text-gray-600">状态</th>
                        <th className="px-8 py-6 text-left text-[28px] font-medium text-gray-600">最后登录</th>
                        <th className="px-8 py-6 text-right text-[28px] font-medium text-gray-600">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-6">
                              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-[28px] font-medium">{user.name[0]}</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-800">{user.name}</p>
                                <p className="text-[24px] text-gray-500">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 text-[28px] text-gray-600">{user.role}</td>
                          <td className="px-8 py-6">
                            <span className={`px-4 py-2 rounded-full text-[24px] font-medium ${
                              user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {user.status === 'active' ? '启用' : '禁用'}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-[28px] text-gray-500">{user.lastLogin}</td>
                          <td className="px-8 py-6 text-right">
                            <button className="text-indigo-600 hover:underline text-[28px]">编辑</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'notification' && (
              <div className="space-y-12">
                <h2 className="text-[36px] font-semibold text-gray-800">通知设置</h2>
                <div className="space-y-6">
                  {notifications.map(notification => (
                    <div key={notification.id} className="flex items-center justify-between p-8 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-8">
                        <button
                          onClick={() => {}}
                          className={`w-12 h-12 rounded-full relative transition-colors ${
                            notification.enabled ? 'bg-indigo-600' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-10 h-10 bg-white rounded-full absolute top-0.5 transition-all ${
                            notification.enabled ? 'right-0.5' : 'left-0.5'
                          }`}></div>
                        </button>
                        <div>
                          <p className="font-medium text-gray-800">{notification.name}</p>
                          <p className="text-[28px] text-gray-500">{notification.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {notification.channels.map((channel, index) => (
                          <span key={index} className="px-4 py-2 bg-gray-100 text-gray-600 text-[24px] rounded">{channel}</span>
                        ))}
                        <ChevronRight className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-12">
                <h2 className="text-[36px] font-semibold text-gray-800">安全设置</h2>
                <div className="space-y-8">
                  <div className="p-8 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <Key className="w-10 h-10 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-800">修改密码</p>
                          <p className="text-[28px] text-gray-500">定期修改密码可以提高账户安全性</p>
                        </div>
                      </div>
                      <button className="px-8 py-4 bg-white border border-gray-300 rounded-lg text-[28px] text-gray-700 hover:bg-gray-50 transition-colors">
                        修改密码
                      </button>
                    </div>
                  </div>
                  <div className="p-8 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <Shield className="w-10 h-10 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-800">双因素认证</p>
                          <p className="text-[28px] text-gray-500">启用双因素认证提高账户安全性</p>
                        </div>
                      </div>
                      <button className="px-8 py-4 bg-indigo-600 text-white rounded-lg text-[28px] hover:bg-indigo-700 transition-colors">
                        启用
                      </button>
                    </div>
                  </div>
                  <div className="p-8 border border-gray-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <Globe className="w-10 h-10 text-gray-500" />
                        <div>
                          <p className="font-medium text-gray-800">登录日志</p>
                          <p className="text-[28px] text-gray-500">查看账户的登录历史记录</p>
                        </div>
                      </div>
                      <button className="px-8 py-4 bg-white border border-gray-300 rounded-lg text-[28px] text-gray-700 hover:bg-gray-50 transition-colors">
                        查看日志
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-12">
                <h2 className="text-[36px] font-semibold text-gray-800">外观设置</h2>
                <div className="space-y-8">
                  <div>
                    <label className="block text-[28px] font-medium text-gray-700 mb-3">主题颜色</label>
                    <div className="flex items-center gap-8">
                      {['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                        <button
                          key={color}
                          className="w-10 h-10 rounded-full ring-2 ring-offset-2"
                          style={{ backgroundColor: color, ringColor: color === '#6366f1' ? color : 'transparent' }}
                        ></button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[28px] font-medium text-gray-700 mb-3">主题模式</label>
                    <div className="flex items-center gap-8">
                      <button className="px-12 py-6 bg-indigo-600 text-white rounded-lg font-medium">浅色</button>
                      <button className="px-12 py-6 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors">深色</button>
                      <button className="px-12 py-6 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors">自动</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[28px] font-medium text-gray-700 mb-3">紧凑模式</label>
                    <div className="flex items-center justify-between p-8 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-700">开启紧凑模式</p>
                        <p className="text-[28px] text-gray-500">减少界面元素的间距，在屏幕上显示更多内容</p>
                      </div>
                      <button className="w-12 h-12 bg-gray-300 rounded-full relative">
                        <div className="w-10 h-10 bg-white rounded-full absolute left-0.5 top-0.5"></div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
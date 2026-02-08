const fs = require('fs');
const path = require('path');

const activityDataPath = path.join(__dirname, '../data/activityData.json');

class ActivityTracker {
    constructor() {
        this.userStats = new Map(); // userId -> { messages: number, lastSeen: timestamp, streak: number }
        this.dailyStats = new Map(); // date -> message count
        this.roleThresholds = [
            { messages: 0, role: '🌱 Newcomer', color: '#95a5a6' },
            { messages: 10, role: '🌿 Active', color: '#2ecc71' },
            { messages: 50, role: '🌳 Regular', color: '#27ae60' },
            { messages: 100, role: '🌲 Veteran', color: '#16a085' },
            { messages: 250, role: '🌳 Elite', color: '#2980b9' },
            { messages: 500, role: '🌳 Legend', color: '#8e44ad' },
            { messages: 1000, role: '👑 Mythic', color: '#f39c12' }
        ];
        
        // Load existing data
        this.loadData();
    }
    
    loadData() {
        try {
            if (fs.existsSync(activityDataPath)) {
                const data = JSON.parse(fs.readFileSync(activityDataPath, 'utf8'));
                
                // Restore user stats
                if (data.userStats) {
                    this.userStats = new Map(Object.entries(data.userStats));
                }
                
                // Restore daily stats
                if (data.dailyStats) {
                    this.dailyStats = new Map(Object.entries(data.dailyStats));
                }
                
                console.log(`📊 Loaded activity data: ${this.userStats.size} users, ${this.dailyStats.size} days`);
            }
        } catch (error) {
            console.error('Error loading activity data:', error);
        }
    }
    
    saveData() {
        try {
            // Clean up old daily stats (older than 30 days)
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 30);
            const cutoffString = cutoffDate.toDateString();
            
            for (const [date] of this.dailyStats) {
                if (date < cutoffString) {
                    this.dailyStats.delete(date);
                }
            }
            
            const data = {
                userStats: Object.fromEntries(this.userStats),
                dailyStats: Object.fromEntries(this.dailyStats),
                lastSaved: new Date().toISOString()
            };
            
            fs.mkdirSync(path.dirname(activityDataPath), { recursive: true });
            fs.writeFileSync(activityDataPath, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving activity data:', error);
        }
    }
    
    async trackMessage(userId, guild) {
        const now = Date.now();
        const today = new Date().toDateString();
        
        // Initialize user stats if not exists
        if (!this.userStats.has(userId)) {
            this.userStats.set(userId, {
                messages: 0,
                lastSeen: now,
                streak: 0,
                dailyMessages: 0,
                lastActiveDate: today
            });
        }
        
        const stats = this.userStats.get(userId);
        
        // Check if it's a new day for streak
        if (stats.lastActiveDate !== today) {
            const yesterday = new Date(now - 86400000).toDateString();
            if (stats.lastActiveDate === yesterday) {
                stats.streak++;
            } else {
                stats.streak = 1;
            }
            stats.dailyMessages = 0;
            stats.lastActiveDate = today;
        }
        
        // Update stats
        stats.messages++;
        stats.lastSeen = now;
        stats.dailyMessages++;
        
        // Update daily stats
        if (!this.dailyStats.has(today)) {
            this.dailyStats.set(today, 0);
        }
        this.dailyStats.set(today, this.dailyStats.get(today) + 1);
        
        // Check for role updates
        await this.checkRoleUpdate(userId, guild);
        
        return stats;
    }
    
    async checkRoleUpdate(userId, guild) {
        const stats = this.userStats.get(userId);
        if (!stats) return;
        
        const member = guild.members.cache.get(userId);
        if (!member) return;
        
        // Find appropriate role based on message count
        let targetRole = null;
        for (const threshold of this.roleThresholds) {
            if (stats.messages >= threshold.messages) {
                targetRole = threshold;
            }
        }
        
        if (!targetRole) return;
        
        // Find or create the role
        let role = guild.roles.cache.find(r => r.name === targetRole.role);
        if (!role) {
            try {
                const roleData = {
                    name: targetRole.role,
                    color: targetRole.color,
                    reason: 'Activity rank role'
                };
                
                // Add image permissions for Mythic role
                if (targetRole.role === '👑 Mythic') {
                    roleData.permissions = [
                        'AttachFiles',
                        'EmbedLinks',
                        'ReadMessageHistory'
                    ];
                    roleData.hoist = false; // Don't display separately from online
                }
                
                role = await guild.roles.create(roleData);
            } catch (error) {
                console.error(`Failed to create role ${targetRole.role}:`, error);
                return;
            }
        } else if (targetRole.role === '👑 Mythic') {
            // Update existing Mythic role to have image permissions
            try {
                await role.setPermissions([
                    'AttachFiles',
                    'EmbedLinks',
                    'ReadMessageHistory'
                ]);
                await role.setHoist(false); // Don't display separately from online
            } catch (error) {
                console.error(`Failed to update permissions for Mythic role:`, error);
            }
        }
        
        // Remove old activity roles
        for (const threshold of this.roleThresholds) {
            const oldRole = guild.roles.cache.find(r => r.name === threshold.role);
            if (oldRole && member.roles.cache.has(oldRole.id)) {
                await member.roles.remove(oldRole.id).catch(() => {});
            }
        }
        
        // Add new role
        await member.roles.add(role.id).catch(() => {});
        
        console.log(`🎯 Updated ${member.user.tag} to ${targetRole.role} (${stats.messages} messages)`);
    }
    
    getLeaderboard(limit = 10) {
        return Array.from(this.userStats.entries())
            .map(([userId, stats]) => ({ userId, ...stats }))
            .sort((a, b) => b.messages - a.messages)
            .slice(0, limit);
    }
    
    getDailyStats() {
        const today = new Date().toDateString();
        return {
            today: this.dailyStats.get(today) || 0,
            yesterday: this.dailyStats.get(new Date(Date.now() - 86400000).toDateString()) || 0,
            week: this.getWeekStats(),
            total: Array.from(this.userStats.values()).reduce((sum, stats) => sum + stats.messages, 0)
        };
    }
    
    getWeekStats() {
        let weekTotal = 0;
        for (let i = 0; i < 7; i++) {
            const date = new Date(Date.now() - (i * 86400000)).toDateString();
            weekTotal += this.dailyStats.get(date) || 0;
        }
        return weekTotal;
    }
    
    getInactiveUsers(thresholdHours = 24) {
        const cutoff = Date.now() - (thresholdHours * 3600000);
        return Array.from(this.userStats.entries())
            .filter(([userId, stats]) => stats.lastSeen < cutoff)
            .map(([userId, stats]) => ({ userId, ...stats }));
    }
    
    getActivityLevel() {
        const today = new Date().toDateString();
        const todayMessages = this.dailyStats.get(today) || 0;
        
        if (todayMessages === 0) return { level: 'DEAD', emoji: '💀', color: '#e74c3c' };
        if (todayMessages < 10) return { level: 'SLOW', emoji: '😴', color: '#f39c12' };
        if (todayMessages < 50) return { level: 'MODERATE', emoji: '🚶', color: '#f1c40f' };
        if (todayMessages < 100) return { level: 'ACTIVE', emoji: '🏃', color: '#2ecc71' };
        return { level: 'BOOMING', emoji: '🔥', color: '#e74c3c' };
    }
}

module.exports = ActivityTracker;

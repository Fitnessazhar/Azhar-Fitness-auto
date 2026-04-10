/**
 * Plugin Loader Module
 * Loads and manages bot plugins
 */

const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');
const config = require('../config');

// Loaded plugins storage
const loadedPlugins = new Map();

/**
 * Load all plugins from the plugins folder
 * @returns {Promise<Map>} Loaded plugins
 */
async function loadPlugins() {
    try {
        const pluginsFolder = path.resolve(config.plugins.folder);
        
        if (!fs.existsSync(pluginsFolder)) {
            logger.warn('Plugins folder not found, creating...');
            fs.mkdirSync(pluginsFolder, { recursive: true });
            return loadedPlugins;
        }

        const files = fs.readdirSync(pluginsFolder);
        let loadedCount = 0;
        
        for (const file of files) {
            if (file.endsWith('.js')) {
                try {
                    const plugin = await loadPluginFile(file);
                    if (plugin) {
                        loadedPlugins.set(plugin.name || file, plugin);
                        loadedCount++;
                    }
                } catch (error) {
                    logger.error(`Error loading plugin ${file}:`, error);
                }
            }
        }
        
        logger.success(`Loaded ${loadedCount} plugins`);
        return loadedPlugins;
        
    } catch (error) {
        logger.error('Error loading plugins:', error);
        return loadedPlugins;
    }
}

/**
 * Load a single plugin file
 * @param {String} filename - Plugin filename
 * @returns {Promise<Object|null>} Plugin object
 */
async function loadPluginFile(filename) {
    try {
        const filePath = path.join(path.resolve(config.plugins.folder), filename);
        
        // Clear require cache for hot reload
        delete require.cache[require.resolve(filePath)];
        
        const plugin = require(filePath);
        
        // Validate plugin structure
        if (!plugin.name) {
            plugin.name = filename.replace('.js', '');
        }
        
        if (!plugin.version) {
            plugin.version = '1.0.0';
        }
        
        logger.debug(`Loaded plugin: ${plugin.name} v${plugin.version}`);
        
        return plugin;
        
    } catch (error) {
        logger.error(`Failed to load plugin ${filename}:`, error);
        return null;
    }
}

/**
 * Get a loaded plugin
 * @param {String} name - Plugin name
 * @returns {Object|null} Plugin object
 */
function getPlugin(name) {
    return loadedPlugins.get(name) || null;
}

/**
 * Get all loaded plugins
 * @returns {Map} All plugins
 */
function getAllPlugins() {
    return loadedPlugins;
}

/**
 * Reload a specific plugin
 * @param {String} name - Plugin name
 * @returns {Promise<Boolean>} Success status
 */
async function reloadPlugin(name) {
    try {
        const plugin = loadedPlugins.get(name);
        if (!plugin) {
            logger.warn(`Plugin not found: ${name}`);
            return false;
        }
        
        const filename = `${name}.js`;
        const newPlugin = await loadPluginFile(filename);
        
        if (newPlugin) {
            loadedPlugins.set(name, newPlugin);
            logger.success(`Reloaded plugin: ${name}`);
            return true;
        }
        
        return false;
        
    } catch (error) {
        logger.error(`Error reloading plugin ${name}:`, error);
        return false;
    }
}

/**
 * Reload all plugins
 * @returns {Promise<Map>} Reloaded plugins
 */
async function reloadAllPlugins() {
    loadedPlugins.clear();
    return await loadPlugins();
}

/**
 * Unload a plugin
 * @param {String} name - Plugin name
 * @returns {Boolean} Success status
 */
function unloadPlugin(name) {
    try {
        if (loadedPlugins.has(name)) {
            loadedPlugins.delete(name);
            logger.success(`Unloaded plugin: ${name}`);
            return true;
        }
        return false;
    } catch (error) {
        logger.error(`Error unloading plugin ${name}:`, error);
        return false;
    }
}

/**
 * Check if plugin is enabled
 * @param {String} name - Plugin name
 * @returns {Boolean}
 */
function isPluginEnabled(name) {
    const enabledPlugins = config.plugins.enabled;
    
    if (enabledPlugins.includes('all')) {
        return true;
    }
    
    return enabledPlugins.includes(name);
}

module.exports = {
    loadPlugins,
    loadPluginFile,
    getPlugin,
    getAllPlugins,
    reloadPlugin,
    reloadAllPlugins,
    unloadPlugin,
    isPluginEnabled
};

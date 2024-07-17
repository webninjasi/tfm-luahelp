
local loader = ({pcall(0)})[2]:match("^(.-)%.")
local player = tfm.get.room.playerList[loader]

tfm.get.room.playerList = {
  [player.playerName] = player
}

local concat = table.concat
local format = string.format
local json = '{'

local function saveVarRecursive(var, path, visited)
  local varName = concat(path, '.') or '_G'
  local varType = type(var)
  local varValue = tostring(var):gsub('<', '&lt;')

  if varType == "function" then
    local ok, msg = pcall(string.dump, var)
    if not ok then
      local javaPath = msg:match('class (.-) cannot be cast to class org.luaj.vm2.LuaClosure')
      json = format('%s"%s":["%s","%s","%s"],', json, varName, varType, varValue, javaPath)
      return
    end
  end

  if varType == "string" then
    varValue = varValue:gsub('\\', '\\\\'):gsub('"', '\\"'):gsub('\r', '\\r'):gsub('\n', '\\n')
  end

  json = format('%s"%s":["%s","%s"],', json, varName, varType, varValue)

  if varType == "table" then
    if not visited[var] then
      local nextIndex = #path + 1

      visited[var] = true

      for key, value in next, var do
        path[nextIndex] = key
        saveVarRecursive(value, path, visited)
      end

      path[nextIndex] = nil
    end
  end
end

saveVarRecursive(_G, {}, {})

setmetatable(_G, {
  __index = function(tbl, key)
    json = format('%s"%s":["event"],', json, key)

    if key == "eventNewGame" then
      return function()
        json = format('%s"__LUA_API_TREE__":[]}', json)
        print(json)
        system.exit()
      end
    end
  end,
})

tfm.exec.newGame(0)

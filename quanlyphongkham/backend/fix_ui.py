import os
import re

file_path = "../frontend/src/components/ai/unified/UnifiedAIChatSystem.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_catch = """    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'err',
        role: 'assistant',
        content: 'Không thể xử lý yêu cầu lúc này.',
        isError: true,
        created_at: new Date().toISOString()
      }]);
    } finally {"""

new_catch = """    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Không thể xử lý yêu cầu lúc này.';
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'err',
        role: 'assistant',
        content: `Đã xảy ra lỗi: ${errorMsg}`,
        isError: true,
        created_at: new Date().toISOString()
      }]);
    } finally {"""

content = content.replace(old_catch, new_catch)

# also replace for handleConfirmTool catch
old_catch_2 = """    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'err',
        role: 'assistant',
        content: 'Lỗi xác nhận hành động.',
        isError: true,
        created_at: new Date().toISOString()
      }]);
    } finally {"""

new_catch_2 = """    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Lỗi xác nhận hành động.';
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'err',
        role: 'assistant',
        content: `Đã xảy ra lỗi: ${errorMsg}`,
        isError: true,
        created_at: new Date().toISOString()
      }]);
    } finally {"""

content = content.replace(old_catch_2, new_catch_2)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Patched UnifiedAIChatSystem.tsx")

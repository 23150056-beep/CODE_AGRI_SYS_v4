from django.contrib import admin

from apps.inventory.models import InputInventory, InventoryTransaction

admin.site.register(InputInventory)
admin.site.register(InventoryTransaction)

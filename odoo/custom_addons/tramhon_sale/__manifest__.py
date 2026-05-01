# -*- coding: utf-8 -*-
{
    'name': "tramhon_sale",

    'summary': """
        Sale module by Tramhon team""",

    'author': "Tran Manh Hung",
    'website': "https://www.google.com",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/16.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Management',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base', 'sale_management', 'tramhon_product', 'sale', 'account'],

    # always loaded
    'data': [
        # 'security/ir.model.access.csv',
        'views/sale_custom_views.xml',
        'views/sale_order_views.xml',
        'data/cron_auto_confirm_so.xml',
    ],
}

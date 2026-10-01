const SocialConstants = {
    FACEBOOK: 'facebook',
    MESSENGER: "messenger",
    config: { //*_*
        messenger: {
            APP_ID: process.env.FACEBOOK_APP_ID,
            APP_SECRET: process.env.FACEBOOK_APP_SECRET,
            scope: 'pages_messaging,pages_manage_metadata,pages_read_engagement'
        },
        facebook: {
            APP_ID: process.env.FACEBOOK_APP_ID,
            APP_SECRET: process.env.FACEBOOK_APP_SECRET,
            scope: 'pages_manage_posts,pages_read_engagement,pages_show_list,business_management,pages_read_user_content,pages_manage_engagement'
        },
    }
}

//27206879988974585 - 438a6a61e91070dc82004a1cdaeddbd5
//On New Customer => add callback login
export default SocialConstants;